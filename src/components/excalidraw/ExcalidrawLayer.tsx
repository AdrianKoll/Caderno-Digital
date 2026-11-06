import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
// CSS publicado pelo pacote Excalidraw.
import '@excalidraw/excalidraw/index.css';
import './ExcalidrawLayer.css';
import { DrawToolbar } from './DrawToolbar';
import { ElementContextPanel } from './ElementContextPanel';
import {
  AlignMode,
  PanelState,
  PropKey,
  alignElements,
  applyProperty,
  derivePanelState,
  distributeElements,
  ensureFontLoaded,
  groupElements,
  innerBox,
  lockElements,
  ungroupElements,
} from './propertyModel';
import { generateId } from '../../utils/id';
import { useNotebookStore } from '../../store/notebookStore';
import { PaperStyle } from '../../types';
import { PaperTone } from '../../hooks/usePaperTone';
import { clampChangedElements, clampResizedSelection, viewportFromAppState } from './canvasBounds';
import { RichTextEditor, EditorAnchor } from '../richtext/RichTextEditor';
import { NativeBuild, buildNative } from '../richtext/native';
import { bump, deleteElements } from '../richtext/elements';
import { EditTarget, findBoxOfPart, findContainer, isRichBox, isRichHolder, isRichPart, resolveEditTarget, richPartsOf } from '../richtext/targets';
import {
  DEFAULT_WIDTH,
  RichCustomData,
  RichDoc,
  defaultDoc,
  docIsEmpty,
  parasFromPlainText,
} from '../richtext/types';

type ExcalidrawAPI = any;
type ExcalidrawElement = any;

/** Estado da câmera usado para sincronizar desenho e escrita. */
export interface ExcalidrawCamera {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

const DEFAULT_CAMERA: ExcalidrawCamera = { scrollX: 0, scrollY: 0, zoom: 1 };
const LIGHT_PAPER_INK = '#202820';
const DARK_PAPER_INK = '#e8ecec';

/** Intervalo do debounce de gravação. */
const SAVE_DELAY_MS = 400;

interface StoredScene {
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  camera?: ExcalidrawCamera;
  files?: Record<string, unknown>;
}

interface Props {
  pageId: string;
  data: string | null;
  active: boolean;
  /** Elemento (ao lado da folha) onde o painel de propriedades é encaixado. */
  panelContainer?: HTMLElement | null;
  /** Coluna à esquerda da folha, onde o editor de texto formatado se encaixa (telas largas). */
  editorContainer?: HTMLElement | null;
  paperStyle: PaperStyle;
  paperTone: PaperTone;
  paperLineSpacing: number;
  onPaperLineSpacingChange: (spacing: number) => void;
  onChange: (pageId: string, serialized: string) => void;
  onSaveStatus: (status: 'saving' | 'saved' | 'error') => void;
}

/** Sessão do editor de texto formatado aberto sobre a folha. */
interface EditorSession {
  key: number;
  mode: 'free' | 'shape';
  doc: RichDoc;
  anchor: EditorAnchor;
  /** Texto formatado que está sendo editado (null = novo). */
  elementId: string | null;
  /** Forma que contém o texto. */
  containerId: string | null;
  /** Textos nativos que viram texto formatado (são apagados ao concluir). */
  removeIds: string[];
  scenePos: { x: number; y: number };
}

const LAYOUT_TOLERANCE = 1.5;

/** Camada de desenho persistente, com toolbar e editor de texto integrados. */
export function ExcalidrawLayer({ pageId, data, active, panelContainer, editorContainer, paperStyle, paperTone, paperLineSpacing, onPaperLineSpacingChange, onChange, onSaveStatus }: Props) {
  const apiRef = useRef<ExcalidrawAPI | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  // Centro da TopBar, onde a barra de ferramentas é encaixada.
  const toolbarSlot = useNotebookStore((s) => s.toolbarSlot);
  const loadedPageId = useRef<string | null>(null);
  const apiReadyRef = useRef(false);
  const autoInkRef = useRef(true);
  const autoInkColorRef = useRef(paperTone === 'dark' ? DARK_PAPER_INK : LIGHT_PAPER_INK);

  const [activeTool, setActiveToolState] = useState('selection');
  const [toolLocked, setToolLocked] = useState(false);
  // Ferramenta "Texto" (formatado): não é uma ferramenta do Excalidraw, então
  // ele fica na seleção e uma camada transparente captura o toque/clique.
  const [richArmed, setRichArmed] = useState(false);
  const richArmedRef = useRef(false);
  // "Travar tela": congela pan/zoom da câmera (o Excalidraw não tem isso
  // nativo). `lockedCameraRef` guarda a câmera no instante da trava.
  const [canvasLocked, setCanvasLocked] = useState(false);
  const canvasLockedRef = useRef(false);
  const lockedCameraRef = useRef<ExcalidrawCamera>(DEFAULT_CAMERA);
  // Versão de cada elemento na última checagem de bordas. Serve para saber
  // quais elementos mudaram (e só esses são empurrados para dentro da folha
  // quando a tela está travada — ver canvasBounds.ts).
  const versionsRef = useRef<Map<string, number>>(new Map());
  // O que o painel mostra (seções visíveis + valores); `null` = painel oculto.
  const [panelState, setPanelState] = useState<PanelState | null>(null);
  const panelKeyRef = useRef('');

  const [editor, setEditor] = useState<EditorSession | null>(null);
  const editorRef = useRef<EditorSession | null>(null);
  const editorKey = useRef(0);
  // Textos formatados sendo refeitos (layout) e os que falharam (não repetir para sempre).
  const richBusy = useRef<Set<string>>(new Set());
  const richFailed = useRef<Set<string>>(new Set());
  // Peças de texto formatado escondidas durante o resize (id -> opacidade original).
  // Ver bloco "Texto formatado no resize" logo abaixo.
  const richResizeHiddenRef = useRef<Map<string, number>>(new Map());

  // Salvamento com atraso: guarda o último estado e grava depois de SAVE_DELAY_MS.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSaveStatusRef = useRef(onSaveStatus);
  onSaveStatusRef.current = onSaveStatus;
  const saveTimer = useRef<number | undefined>(undefined);
  // Guarda uma função que monta o JSON (em vez do JSON pronto): a montagem custa caro
  // (percorre todos os elementos e copia as imagens) e antes rodava a cada movimento do
  // dedo/caneta. Agora só roda quando o salvamento realmente dispara.
  const pendingSave = useRef<{ pageId: string; build: () => string } | null>(null);

  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    const pending = pendingSave.current;
    if (pending) {
      pendingSave.current = null;
      try {
        void Promise.resolve(onChangeRef.current(pending.pageId, pending.build())).then(
          () => onSaveStatusRef.current('saved'),
          (error) => { console.error('Falha ao salvar a cena:', error); onSaveStatusRef.current('error'); },
        );
      } catch (error) {
        console.error('Falha ao serializar a cena:', error);
        onSaveStatusRef.current('error');
      }
    }
  }, []);

  const queueSave = useCallback(
    (build: () => string) => {
      if (!loadedPageId.current) return;
      pendingSave.current = { pageId: loadedPageId.current, build };
      onSaveStatusRef.current('saving');
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(flushSave, SAVE_DELAY_MS);
    },
    [flushSave],
  );

  // Grava o que estiver pendente ao sair da página / fechar a aba / desmontar.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushSave);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushSave);
      flushSave();
    };
  }, [flushSave]);

  const loadScene = useCallback(
    (api: ExcalidrawAPI) => {
      let scene: StoredScene = { elements: [], appState: {} };
      if (data) {
        try {
          scene = JSON.parse(data);
        } catch {
          scene = { elements: [], appState: {} };
        }
      }
      const camera = scene.camera ?? DEFAULT_CAMERA;
      const storedInk = scene.appState?.currentItemStrokeColor;
      const defaultInk = paperTone === 'dark' ? DARK_PAPER_INK : LIGHT_PAPER_INK;
      autoInkRef.current = typeof storedInk !== 'string';
      autoInkColorRef.current = typeof storedInk === 'string' ? storedInk : defaultInk;
      // Arquivos (imagens, texto formatado) antes dos elementos que os usam.
      const files = scene.files ? Object.values(scene.files) : [];
      if (files.length) api.addFiles(files);
      api.updateScene({
        elements: scene.elements ?? [],
        appState: {
          ...scene.appState,
          currentItemStrokeColor: typeof storedInk === 'string' ? storedInk : defaultInk,
          viewBackgroundColor: 'transparent',
          scrollX: camera.scrollX,
          scrollY: camera.scrollY,
          zoom: { value: camera.zoom },
        },
      });
    },
    [data, paperTone],
  );

  useEffect(() => {
    const api = apiRef.current;
    const nextInk = paperTone === 'dark' ? DARK_PAPER_INK : LIGHT_PAPER_INK;
    if (autoInkRef.current && api?.getAppState?.().currentItemStrokeColor === autoInkColorRef.current) {
      autoInkColorRef.current = nextInk;
      api.updateScene({ appState: { currentItemStrokeColor: nextInk } });
    }
  }, [paperTone]);

  // Troca de página: recarrega elementos + câmera daquela página específica.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || loadedPageId.current === pageId) return;
    flushSave(); // o que estava pendente pertence à página anterior
    loadedPageId.current = pageId;
    loadScene(api);
    panelKeyRef.current = '';
    setPanelState(null);
    canvasLockedRef.current = false;
    setCanvasLocked(false);
    versionsRef.current = new Map();
    richBusy.current = new Set();
    richFailed.current = new Set();
    closeEditorSilently();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const handleExcalidrawApi = useCallback(
    (api: ExcalidrawAPI) => {
      apiRef.current = api;
      if (loadedPageId.current !== pageId) {
        loadedPageId.current = pageId;
        loadScene(api);
      }
      apiReadyRef.current = true;
    },
    [pageId, loadScene],
  );

  // -----------------------------------------------------------------------
  // Texto formatado: criação, edição e refazer o desenho
  // -----------------------------------------------------------------------
  function getSelectedIds(): Set<string> {
    const state = apiRef.current?.getAppState?.() ?? {};
    return new Set(Object.keys(state.selectedElementIds ?? {}));
  }

  function clientToScene(clientX: number, clientY: number) {
    const st = apiRef.current.getAppState();
    const rect = layerRef.current!.getBoundingClientRect();
    const z = st.zoom?.value ?? 1;
    return { x: (clientX - rect.left) / z - (st.scrollX ?? 0), y: (clientY - rect.top) / z - (st.scrollY ?? 0) };
  }

  function sceneToAnchor(x: number, y: number, width: number): EditorAnchor {
    const st = apiRef.current.getAppState();
    const rect = layerRef.current!.getBoundingClientRect();
    const z = st.zoom?.value ?? 1;
    return {
      left: rect.left + (x + (st.scrollX ?? 0)) * z,
      top: rect.top + (y + (st.scrollY ?? 0)) * z,
      width: width * z,
      zoom: z,
    };
  }

  function openSession(session: Omit<EditorSession, 'key'>) {
    editorKey.current += 1;
    const next = { ...session, key: editorKey.current };
    editorRef.current = next;
    setEditor(next);
  }

  function closeEditorSilently() {
    editorRef.current = null;
    setEditor(null);
  }

  function defaultsFromAppState(): Partial<RichDoc> {
    const st = apiRef.current?.getAppState?.() ?? {};
    return {
      fontFamily: st.currentItemFontFamily ?? 5,
      fontSize: st.currentItemFontSize ?? 20,
      color: st.currentItemStrokeColor ?? (paperTone === 'dark' ? '#e8ecec' : '#202820'),
      align: st.currentItemTextAlign ?? 'left',
    };
  }

  function docFromNativeText(t: ExcalidrawElement, inShape: boolean, width: number): RichDoc {
    return defaultDoc({
      paras: parasFromPlainText((t.originalText ?? t.text ?? '') as string),
      fontFamily: t.fontFamily ?? 5,
      fontSize: t.fontSize ?? 20,
      lineHeight: t.lineHeight ?? 1.25,
      align: inShape ? 'center' : (t.textAlign ?? 'left'),
      color: t.strokeColor ?? '#1e1e1e',
      width,
      fixedWidth: inShape,
    });
  }

  function openNewEditor(x: number, y: number) {
    const width = DEFAULT_WIDTH;
    openSession({
      mode: 'free',
      doc: defaultDoc({ ...defaultsFromAppState(), width }),
      anchor: sceneToAnchor(x, y, width),
      elementId: null,
      containerId: null,
      removeIds: [],
      scenePos: { x, y },
    });
  }

  function openEditor(target: EditTarget) {
    const api = apiRef.current;
    if (!api) return;
    const elements: ExcalidrawElement[] = api.getSceneElements();
    const el = target.el;

    if (target.kind === 'rich') {
      const data = el.customData as RichCustomData;
      const container = findContainer(el, elements);
      if (container) {
        const inner = innerBox(container);
        openSession({
          mode: 'shape',
          doc: { ...data.rich, width: inner.w, fixedWidth: true },
          anchor: sceneToAnchor(inner.x, inner.y, inner.w),
          elementId: el.id,
          containerId: container.id,
          removeIds: [],
          scenePos: { x: el.x, y: el.y },
        });
      } else {
        const width = Math.max(data.rich.width, DEFAULT_WIDTH);
        openSession({
          mode: 'free',
          doc: { ...data.rich, width },
          anchor: sceneToAnchor(el.x, el.y, width),
          elementId: el.id,
          containerId: null,
          removeIds: [],
          scenePos: { x: el.x, y: el.y },
        });
      }
      return;
    }

    if (target.kind === 'shape') {
      const inner = innerBox(el);
      const bound = (el.boundElements ?? [])
        .filter((b: any) => b.type === 'text')
        .map((b: any) => elements.find((e) => e.id === b.id && !e.isDeleted))
        .filter(Boolean) as ExcalidrawElement[];
      const doc = bound.length
        ? docFromNativeText(bound[0], true, inner.w)
        : defaultDoc({ ...defaultsFromAppState(), align: 'center', width: inner.w, fixedWidth: true });
      openSession({
        mode: 'shape',
        doc,
        anchor: sceneToAnchor(inner.x, inner.y, inner.w),
        elementId: null,
        containerId: el.id,
        removeIds: bound.map((b) => b.id),
        scenePos: { x: inner.x, y: inner.y },
      });
      return;
    }

    // Texto nativo solto: vira texto formatado.
    const width = Math.max(Math.ceil(el.width) + 40, DEFAULT_WIDTH);
    openSession({
      mode: 'free',
      doc: docFromNativeText(el, false, width),
      anchor: sceneToAnchor(el.x, el.y, width),
      elementId: null,
      containerId: null,
      removeIds: [el.id],
      scenePos: { x: el.x, y: el.y },
    });
  }

  /** A que grupo o texto formatado pertence (o texto e a forma que o contém ficam no mesmo grupo). */
  function richGroupIds(existing: ExcalidrawElement | null, container: ExcalidrawElement | null) {
    if (existing?.groupIds?.length) return { groupIds: existing.groupIds as string[], newGroupId: null as string | null };
    const gid = generateId();
    return { groupIds: [gid, ...((container?.groupIds ?? []) as string[])], newGroupId: gid };
  }

  /**
   * Monta o texto formatado como elementos nativos (caixa invisível + um
   * texto por trecho de cor; só os trechos em itálico viram imagem). Para texto dentro de forma, a largura é a da
   * área útil da forma e o bloco fica centralizado nela.
   */
  async function buildRich(
    doc: RichDoc,
    container: ExcalidrawElement | null,
    at: { x: number; y: number },
    groupIds: string[],
    opacity: number,
  ): Promise<NativeBuild> {
    const inner = container ? innerBox(container) : null;
    const maxWidth = inner ? inner.w : doc.width;
    return buildNative(doc, {
      maxWidth,
      hug: !inner && !doc.fixedWidth,
      groupIds,
      opacity,
      container: container ? { width: container.width, height: container.height } : null,
      place: (w, h) => (inner ? { x: inner.x + (inner.w - w) / 2, y: inner.y + (inner.h - h) / 2 } : at),
    });
  }

  /**
   * Coloca o texto formatado na cena no lugar do anterior: apaga a caixa e as
   * peças antigas (ou a imagem, nos textos antigos), mais os textos nativos
   * que estão sendo convertidos, e põe as novas logo acima na ordem de
   * camadas. Roda de uma vez só (sem `await`), para não perder mudanças feitas
   * pelo usuário no meio do caminho.
   */
  function writeRich(args: {
    oldHolder: ExcalidrawElement | null;
    container: ExcalidrawElement | null;
    newGroupId: string | null;
    built: NativeBuild;
    removeIds: Set<string>;
    select: boolean;
    /** true: mantém o resto da seleção (refazer layout); false: seleciona só o texto novo (edição concluída). */
    keepSelection: boolean;
  }) {
    const api = apiRef.current;
    if (!api) return;
    const { oldHolder, container, newGroupId, built, removeIds, select, keepSelection } = args;
    let elements: ExcalidrawElement[] = [...api.getSceneElements()];

    const drop = new Set<string>(removeIds);
    let insertAfter = -1;
    if (oldHolder) {
      drop.add(oldHolder.id);
      if (isRichBox(oldHolder)) for (const part of richPartsOf(oldHolder, elements)) drop.add(part.id);
      insertAfter = elements.findIndex((e) => e.id === oldHolder.id);
    } else if (container) {
      insertAfter = elements.findIndex((e) => e.id === container.id);
    }

    // Imagens dos trechos em itálico: entram no cache de arquivos antes dos elementos que as usam.
    if (built.files.length) api.addFiles(built.files);

    elements = deleteElements(elements, drop);
    if (container && newGroupId) {
      elements = elements.map((e) =>
        e.id === container.id ? bump(e, { groupIds: [newGroupId, ...(e.groupIds ?? [])] }) : e,
      );
    }
    const at = insertAfter >= 0 ? insertAfter + 1 : elements.length;
    elements.splice(at, 0, built.box, ...built.parts);

    const st = api.getAppState();
    const selectedElementIds: Record<string, boolean> = keepSelection ? { ...(st.selectedElementIds ?? {}) } : {};
    const selectedGroupIds: Record<string, boolean> = keepSelection ? { ...(st.selectedGroupIds ?? {}) } : {};
    for (const id of drop) delete selectedElementIds[id];
    if (select) {
      selectedElementIds[built.box.id] = true;
      for (const part of built.parts) selectedElementIds[part.id] = true;
      if (container) selectedElementIds[container.id] = true;
      selectedGroupIds[built.groupIds[0]] = true;
    }
    api.updateScene({ elements, appState: { selectedElementIds, selectedGroupIds } });
  }

  async function commitEditor(doc: RichDoc) {
    const session = editorRef.current;
    closeEditorSilently();
    const api = apiRef.current;
    if (!api || !session) return;

    const removeIds = new Set<string>(session.removeIds);
    const leaveTool = () => {
      if (richArmedRef.current && !toolLocked) disarmRich();
    };

    const before: ExcalidrawElement[] = api.getSceneElements();
    const existing = session.elementId ? (before.find((e) => e.id === session.elementId) ?? null) : null;

    if (docIsEmpty(doc)) {
      // Texto vazio: some o bloco (e o texto nativo que estava sendo convertido).
      if (existing) {
        removeIds.add(existing.id);
        if (isRichBox(existing)) for (const part of richPartsOf(existing, before)) removeIds.add(part.id);
      }
      if (removeIds.size) {
        api.updateScene({
          elements: deleteElements(before, removeIds),
          appState: { selectedElementIds: {}, selectedGroupIds: {} },
        });
      }
      leaveTool();
      return;
    }

    const container = session.containerId
      ? (before.find((e) => e.id === session.containerId && !e.isDeleted) ?? null)
      : null;
    const { groupIds, newGroupId } = richGroupIds(existing, container);
    const built = await buildRich(
      doc,
      container,
      existing ? { x: existing.x, y: existing.y } : session.scenePos,
      groupIds,
      existing?.opacity ?? 100,
    );

    // Relê a cena depois do `await` (o usuário pode ter mexido em algo).
    const oldHolder = existing ? (api.getSceneElements().find((e: ExcalidrawElement) => e.id === existing.id) ?? null) : null;
    writeRich({ oldHolder, container, newGroupId, built, removeIds, select: true, keepSelection: false });
    leaveTool();
  }

  function cancelEditor() {
    closeEditorSilently();
    if (richArmedRef.current && !toolLocked) disarmRich();
  }

  function disarmRich() {
    richArmedRef.current = false;
    setRichArmed(false);
    setActiveToolState('selection');
  }

  function needsRelayout(el: ExcalidrawElement, elements: readonly ExcalidrawElement[]): boolean {
    const data = el.customData as RichCustomData;
    const lay = data.lay;
    if (!lay) return true;
    if (el.angle) return false; // girado: deixa como está (refazer o layout desfaria a rotação)
    if (!el.groupIds?.length) return false; // desagrupado à mão: as peças ficam soltas, não mexemos mais
    const container = findContainer(el, elements);
    if (data.inShape && !container) return true; // a forma sumiu / foi desagrupada
    const sizeOff = Math.abs(el.width - lay.w) > LAYOUT_TOLERANCE || Math.abs(el.height - lay.h) > LAYOUT_TOLERANCE;
    if (container) {
      return (
        sizeOff ||
        Math.abs(container.width - (lay.cw ?? 0)) > LAYOUT_TOLERANCE ||
        Math.abs(container.height - (lay.ch ?? 0)) > LAYOUT_TOLERANCE
      );
    }
    return sizeOff;
  }

  /**
   * Refaz o texto formatado (as peças nativas). Roda quando o usuário
   * redimensiona o bloco (o texto reflui na nova largura, sem esticar), quando
   * a forma que o contém muda de tamanho, ou quando o painel muda
   * tamanho/espaçamento. Aceita também um texto antigo (imagem), que vira um
   * grupo nativo.
   */
  async function rebuildRich(id: string, mutate?: (doc: RichDoc) => RichDoc) {
    const api = apiRef.current;
    if (!api) return;
    const elements: ExcalidrawElement[] = api.getSceneElements();
    const el = elements.find((e) => e.id === id);
    if (!el || !isRichHolder(el)) return;
    const data = el.customData as RichCustomData;
    const container = findContainer(el, elements);

    let doc = mutate ? mutate(data.rich) : data.rich;
    const resizedBox = !container && !mutate && isRichBox(el);
    const wChanged = resizedBox && Math.abs(el.width - (data.lay?.w ?? el.width)) > LAYOUT_TOLERANCE;
    const hChanged = resizedBox && Math.abs(el.height - (data.lay?.h ?? el.height)) > LAYOUT_TOLERANCE;
    if (wChanged) {
      // Redimensionou na horizontal: a nova largura passa a valer (largura fixa).
      doc = { ...doc, fixedWidth: true, width: el.width };
    }
    const wasSelected = getSelectedIds().has(el.id);
    const { groupIds, newGroupId } = richGroupIds(el, container);
    const built = await buildRich(doc, container, { x: el.x, y: el.y }, groupIds, el.opacity ?? 100);

    // Redimensionou na vertical (ou no canto): preserva a altura escolhida pelo
    // usuário. A fonte NÃO muda — a caixa só fica mais alta/mais baixa, com
    // espaço em branco no rodapé (como num textarea). O `lay.h` é atualizado
    // para o próximo `needsRelayout` não disparar sem motivo.
    if (hChanged) {
      const altura = Math.max(el.height, doc.fontSize * 2);
      built.box = { ...built.box, height: altura };
      built.box.customData = {
        ...built.box.customData,
        lay: { ...built.box.customData.lay, h: altura },
      };
    }

    const oldHolder = api.getSceneElements().find((e: ExcalidrawElement) => e.id === id);
    if (!oldHolder) return;
    writeRich({
      oldHolder,
      container,
      newGroupId,
      built,
      removeIds: new Set(),
      select: wasSelected || getSelectedIds().has(id),
      keepSelection: true,
    });
  }

  function scheduleRichCheck(elements: readonly ExcalidrawElement[]) {
    const ids: string[] = [];
    for (const el of elements) {
      if (!isRichBox(el)) continue;
      const key = `${el.id}:${el.version}`;
      if (richBusy.current.has(el.id) || richFailed.current.has(key)) continue;
      if (needsRelayout(el, elements)) ids.push(el.id);
    }
    if (ids.length === 0) return;
    // Em resize, falhas anteriores não podem bloquear o rebuild — senão as peças
    // de texto continuam com o tamanho esticado pelo grupo do Excalidraw.
    ids.forEach((id) => {
      for (const key of Array.from(richFailed.current.keys())) {
        if (key.startsWith(`${id}:`)) richFailed.current.delete(key);
      }
    });
    ids.forEach((id) => richBusy.current.add(id));
    window.setTimeout(() => {
      Promise.all(
        ids.map(async (id) => {
          try {
            await rebuildRich(id);
          } catch {
            const el = apiRef.current?.getSceneElements().find((e: ExcalidrawElement) => e.id === id);
            if (el) richFailed.current.add(`${id}:${el.version}`);
          } finally {
            richBusy.current.delete(id);
          }
        }),
      );
    }, 0);
  }

  // -----------------------------------------------------------------------
  // Mudanças da cena
  // -----------------------------------------------------------------------
  const handleChange = useCallback(
    (elements: readonly unknown[], appState: Record<string, any>, files?: Record<string, any>) => {
      if (!apiReadyRef.current) return;
      if (autoInkRef.current && typeof appState?.currentItemStrokeColor === 'string'
        && appState.currentItemStrokeColor !== autoInkColorRef.current) {
        autoInkRef.current = false;
      }

      const zoomValue = appState?.zoom?.value ?? 1;
      const camera: ExcalidrawCamera = {
        scrollX: appState?.scrollX ?? 0,
        scrollY: appState?.scrollY ?? 0,
        zoom: zoomValue,
      };

      const selectedIds: Record<string, boolean> = appState?.selectedElementIds ?? {};

      // Painel de propriedades: aparece com seleção ou com uma ferramenta de
      // desenho ativa (aí edita o padrão dos próximos elementos). Só atualiza
      // o estado do React quando o conteúdo do painel realmente muda.
      const nextPanel = derivePanelState(elements as ExcalidrawElement[], appState);
      const panelKey = nextPanel ? JSON.stringify(nextPanel) : '';
      if (panelKey !== panelKeyRef.current) {
        panelKeyRef.current = panelKey;
        setPanelState(nextPanel);
      }

      // Tela travada: se pan/zoom mudou (roda do mouse, pinça, arrastar com
      // a mão), devolve a câmera para onde estava. `updateScene` com os
      // mesmos valores não dispara nova diferença, então não entra em loop.
      if (canvasLockedRef.current) {
        const lc = lockedCameraRef.current;
        const moved =
          Math.abs(camera.scrollX - lc.scrollX) > 0.01 ||
          Math.abs(camera.scrollY - lc.scrollY) > 0.01 ||
          Math.abs(camera.zoom - lc.zoom) > 0.0001;
        if (moved) {
          apiRef.current?.updateScene({
            appState: { scrollX: lc.scrollX, scrollY: lc.scrollY, zoom: { value: lc.zoom } },
          });
          return;
        }
      }

      // Tela travada = folha com bordas: elementos movidos, criados, colados
      // ou editados não podem sair da área visível. Enquanto o usuário está
      // girando, desenhando uma forma nova ou digitando um texto, deixamos
      // passar (senão a peça "escorregaria" sob o ponteiro) e ajustamos assim
      // que a interação termina. No redimensionamento a peça para de crescer
      // ao encostar na borda (clampResizedSelection).
      const interacting = !!(
        appState?.newElement ||
        appState?.resizingElement ||
        appState?.isResizing ||
        appState?.isRotating ||
        appState?.multiElement ||
        appState?.editingTextElement ||
        appState?.editingElement
      );
      let elementsToSave: readonly unknown[] = elements;

      const resizing = !!(appState?.isResizing || appState?.resizingElement);

      // Texto formatado no resize: o bloco é um GRUPO (caixa invisível + vários
      // trechos de texto). O Excalidraw escala o grupo inteiro ao redimensionar,
      // então as letras "esticam" junto com a caixa durante o arrasto e só
      // voltam ao tamanho normal quando o rebuild roda ao soltar. Para não
      // mostrar esse esticão, escondemos as peças de texto no início do
      // arrasto; ao soltar, o scheduleRichCheck recria o texto na largura nova,
      // sem esticar. (A opacidade é restaurada na serialização e no release,
      // então nada de texto invisível é persistido.)
      // A trava `size === 0` é obrigatória: o `updateScene` abaixo dispara um
      // novo `onChange`; sem a trava o resize entra em loop infinito e a tela
      // trava (fica preta). Esconder as peças uma única vez, no primeiro evento
      // do arrasto, já basta — o Excalidraw mantém o opacity:0 durante todo o
      // arrasto. A detecção por `selectedGroupIds` cobre o caso de seleção por
      // grupo (em que `selectedElementIds` fica vazio).
      if (interacting && resizing && !appState?.editingTextElement && richResizeHiddenRef.current.size === 0) {
        const selected = new Set(Object.keys(selectedIds));
        const selectedGroups = new Set(Object.keys(appState?.selectedGroupIds ?? {}));
        const holderIds = new Set<string>();
        for (const el of elements as ExcalidrawElement[]) {
          // Seleção por grupo: o holder é quem tem o groupId selecionado.
          if (el.groupIds?.some((g: string) => selectedGroups.has(g)) && isRichHolder(el)) {
            holderIds.add(el.id);
          }
          if (!selected.has(el.id)) continue;
          if (isRichHolder(el)) holderIds.add(el.id);
          else if (isRichPart(el)) {
            const box = findBoxOfPart(el, elements as ExcalidrawElement[]);
            if (box) holderIds.add(box.id);
          }
        }
        if (holderIds.size) {
          const partIds = new Set<string>();
          for (const el of elements as ExcalidrawElement[]) {
            if (!isRichHolder(el) || !holderIds.has(el.id)) continue;
            for (const p of richPartsOf(el, elements as ExcalidrawElement[])) {
              partIds.add(p.id);
              // Guarda a opacidade original só na primeira vez (reafirmar a
              // cada evento durante o arrasto não pode sobrescrevê-la com 0).
              if (!richResizeHiddenRef.current.has(p.id)) {
                richResizeHiddenRef.current.set(p.id, (p as any).opacity ?? 100);
              }
            }
          }
          if (partIds.size) {
            apiRef.current?.updateScene({
              elements: (elements as ExcalidrawElement[]).map((e) =>
                partIds.has(e.id) ? { ...(e as any), opacity: 0 } : e,
              ),
            });
          }
        }
      }

      if (interacting && resizing && canvasLockedRef.current && !appState?.editingTextElement) {
        const viewport = viewportFromAppState(appState);
        if (viewport) {
          const changed = new Set<string>();
          for (const el of elements as ExcalidrawElement[]) {
            if (versionsRef.current.get(el.id) !== el.version) changed.add(el.id);
          }
          const limited = clampResizedSelection(
            elements as ExcalidrawElement[],
            changed,
            new Set(Object.keys(selectedIds)),
            viewport,
          );
          if (limited) {
            elementsToSave = limited;
            apiRef.current?.updateScene({ elements: limited });
          }
        }
      }

      if (!interacting) {
        if (canvasLockedRef.current) {
          const viewport = viewportFromAppState(appState);
          if (viewport) {
            const changed = new Set<string>();
            for (const el of elements as ExcalidrawElement[]) {
              if (versionsRef.current.get(el.id) !== el.version) changed.add(el.id);
            }
            const shifted = clampChangedElements(
              elements as ExcalidrawElement[],
              changed,
              new Set(Object.keys(selectedIds)),
              viewport,
            );
            if (shifted) {
              elementsToSave = shifted;
              apiRef.current?.updateScene({ elements: shifted });
            }
          }
        }
        versionsRef.current = new Map(
          (elementsToSave as ExcalidrawElement[]).map((el) => [el.id, el.version] as [string, number]),
        );
        // Texto formatado que foi redimensionado (ou cuja forma mudou) é redesenhado.
        scheduleRichCheck(elementsToSave as ExcalidrawElement[]);

        // Fim do resize: restaura a opacidade das peças de texto escondidas.
        // Se o rebuild precisou rodar, as peças antigas já foram substituídas
        // e este update é sem efeito; se não precisou (tamanho não mudou), as
        // peças voltam a aparecer.
        if (richResizeHiddenRef.current.size) {
          const hidden = richResizeHiddenRef.current;
          richResizeHiddenRef.current = new Map();
          const live = (apiRef.current?.getSceneElements() ?? []) as ExcalidrawElement[];
          if (live.some((e) => hidden.has(e.id))) {
            apiRef.current?.updateScene({
              elements: live.map((e) =>
                hidden.has(e.id) ? { ...(e as any), opacity: hidden.get(e.id) ?? (e as any).opacity ?? 100 } : e,
              ),
            });
          }
        }
      }

      // Mantém nossa barra própria sincronizada com o estado real do
      // Excalidraw (ferramenta ativa e "cadeado"), inclusive quando a troca
      // acontece por atalho de teclado.
      const toolType = appState?.activeTool?.type;
      if (toolType) {
        if (richArmedRef.current) {
          // Com a ferramenta "Texto" armada o Excalidraw fica em "selection".
          if (toolType !== 'selection') {
            richArmedRef.current = false;
            setRichArmed(false);
            setActiveToolState(toolType);
          }
        } else if (toolType !== activeTool) {
          setActiveToolState(toolType);
        }
      }
      const locked = !!appState?.activeTool?.locked;
      if (locked !== toolLocked) setToolLocked(locked);

      // Persistimos elementos + câmera + os arquivos (imagens) que ainda são
      // usados por algum elemento, para o texto formatado sobreviver a um reload.
      // A montagem do JSON é adiada para a hora de gravar (ver queueSave).
      const sceneElements = elementsToSave as ExcalidrawElement[];
      queueSave(() => {
        const used = new Set<string>();
        for (const el of sceneElements) {
          if (!el.isDeleted && el.type === 'image' && el.fileId) used.add(el.fileId);
        }
        const keptFiles: Record<string, unknown> = {};
        for (const id of used) if (files?.[id]) keptFiles[id] = files[id];
        return JSON.stringify({
          // Elementos apagados só servem ao desfazer desta sessão; não vão para o banco
          // (senão cada edição de texto deixaria dezenas de peças antigas no JSON).
          // Peças de texto escondidas durante o resize têm a opacidade restaurada aqui,
          // para nunca gravar texto invisível.
          elements: sceneElements
            .filter((el) => !el.isDeleted)
            .map((el) =>
              richResizeHiddenRef.current.has(el.id)
                ? { ...el, opacity: richResizeHiddenRef.current.get(el.id) ?? (el as any).opacity ?? 100 }
                : el,
            ),
          appState: { viewBackgroundColor: 'transparent' },
          camera,
          files: keptFiles,
        });
      });
    },
    [queueSave, activeTool, toolLocked],
  );

  function handleSelectTool(tool: string) {
    const api = apiRef.current;
    if (!api) return;
    if (tool === 'richtext') {
      richArmedRef.current = true;
      setRichArmed(true);
      api.setActiveTool({ type: 'selection', locked: toolLocked });
      api.updateScene({ appState: { selectedElementIds: {}, selectedGroupIds: {} } });
      setActiveToolState('richtext');
      return;
    }
    richArmedRef.current = false;
    setRichArmed(false);
    api.setActiveTool({ type: tool, locked: toolLocked });
    setActiveToolState(tool);
  }

  function handleToggleCanvasLock() {
    const api = apiRef.current;
    if (!api) return;
    const next = !canvasLockedRef.current;
    if (next) {
      const st = api.getAppState();
      lockedCameraRef.current = {
        scrollX: st.scrollX ?? 0,
        scrollY: st.scrollY ?? 0,
        zoom: st.zoom?.value ?? 1,
      };
    }
    canvasLockedRef.current = next;
    setCanvasLocked(next);
  }

  /**
   * Sticky note: o Excalidraw não tem uma ferramenta nativa disso, então
   * criamos um retângulo amarelo com texto vinculado (label) no centro da
   * área visível. Já sai selecionado; duplo clique edita o texto (com o
   * editor de texto formatado).
   */
  function handleAddStickyNote() {
    const api = apiRef.current;
    if (!api) return;
    const st = api.getAppState();
    const zoom = st.zoom?.value ?? 1;
    const w = 190;
    const h = 150;
    const cx = (st.width ?? 800) / 2 / zoom - (st.scrollX ?? 0);
    const cy = (st.height ?? 600) / 2 / zoom - (st.scrollY ?? 0);
    const jitter = () => (Math.random() - 0.5) * 40;
    const created = convertToExcalidrawElements([
      {
        type: 'rectangle',
        x: cx - w / 2 + jitter(),
        y: cy - h / 2 + jitter(),
        width: w,
        height: h,
        backgroundColor: '#ffec99',
        strokeColor: '#f08c00',
        fillStyle: 'solid',
        roughness: 0,
        roundness: { type: 3 },
        label: { text: 'Nota', fontSize: 20, strokeColor: '#1e1e1e' },
      } as any,
    ]) as ExcalidrawElement[];
    const rect = created.find((el) => el.type === 'rectangle');
    api.updateScene({
      elements: [...api.getSceneElements(), ...created],
      appState: { selectedElementIds: rect ? { [rect.id]: true } : {} },
    });
    api.setActiveTool({ type: 'selection' });
    setActiveToolState('selection');
  }

  /**
   * Desfazer/refazer: o Excalidraw não expõe isso na API pública, então
   * mandamos o mesmo atalho de teclado que ele já escuta (Ctrl+Z / Ctrl+Shift+Z).
   */
  function sendUndoShortcut(redo: boolean) {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', ctrlKey: true, shiftKey: redo, bubbles: true, cancelable: true }),
    );
  }

  function handleToggleLock() {
    const next = !toolLocked;
    apiRef.current?.setActiveTool({ type: richArmed ? 'selection' : activeTool, locked: next });
    setToolLocked(next);
  }

  // -----------------------------------------------------------------------
  // Entradas do editor de texto: duplo clique, Enter e a camada da ferramenta "Texto"
  // -----------------------------------------------------------------------
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !active) return;

    const onDoubleClick = (e: MouseEvent) => {
      const api = apiRef.current;
      if (!api || richArmedRef.current || editorRef.current) return;
      const st = api.getAppState();
      if (st.activeTool?.type !== 'selection') return;
      const ids = new Set<string>(Object.keys(st.selectedElementIds ?? {}));
      if (ids.size === 0) {
        // Área vazia: novo texto formatado no ponto do clique.
        e.preventDefault();
        e.stopPropagation();
        const p = clientToScene(e.clientX, e.clientY);
        openNewEditor(p.x, p.y);
        return;
      }
      const target = resolveEditTarget(api.getSceneElements(), ids);
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        openEditor(target);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const api = apiRef.current;
      if (!api || richArmedRef.current || editorRef.current) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const st = api.getAppState();
      if (st.editingTextElement || st.activeTool?.type !== 'selection') return;
      const ids = new Set<string>(Object.keys(st.selectedElementIds ?? {}));
      const target = resolveEditTarget(api.getSceneElements(), ids);
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        openEditor(target);
      }
    };

    layer.addEventListener('dblclick', onDoubleClick, true);
    layer.addEventListener('keydown', onKeyDown, true);
    return () => {
      layer.removeEventListener('dblclick', onDoubleClick, true);
      layer.removeEventListener('keydown', onKeyDown, true);
    };
    // openEditor/openNewEditor só usam refs e a API — não precisam recriar o listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  /** Toque na folha com a ferramenta "Texto" armada: edita o texto que está ali ou cria um novo. */
  function handleCapturePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const api = apiRef.current;
    if (!api) return;
    e.preventDefault();
    const p = clientToScene(e.clientX, e.clientY);
    const elements: ExcalidrawElement[] = api.getSceneElements();
    const hit = [...elements]
      .reverse()
      .find(
        (el) =>
          isRichHolder(el) &&
          !el.locked &&
          p.x >= el.x &&
          p.x <= el.x + el.width &&
          p.y >= el.y &&
          p.y <= el.y + el.height,
      );
    if (hit) openEditor({ kind: 'rich', el: hit });
    else openNewEditor(p.x, p.y);
  }

  // -----------------------------------------------------------------------
  // Caixa de edição de objetos (painel de propriedades)
  // -----------------------------------------------------------------------
  function bumpAndUpdate(patch: Partial<ExcalidrawElement>) {
    const api = apiRef.current;
    if (!api) return;
    const ids = getSelectedIds();
    const elements: ExcalidrawElement[] = api
      .getSceneElements()
      .map((el: ExcalidrawElement) => (ids.has(el.id) ? bump(el, patch) : el));
    api.updateScene({ elements });
  }

  function handleReorder(direction: 'toBack' | 'backward' | 'forward' | 'toFront') {
    const api = apiRef.current;
    if (!api) return;
    const ids = getSelectedIds();
    let elements: ExcalidrawElement[] = [...api.getSceneElements()];

    if (direction === 'toBack') {
      const sel = elements.filter((el) => ids.has(el.id));
      const rest = elements.filter((el) => !ids.has(el.id));
      elements = [...sel, ...rest];
    } else if (direction === 'toFront') {
      const sel = elements.filter((el) => ids.has(el.id));
      const rest = elements.filter((el) => !ids.has(el.id));
      elements = [...rest, ...sel];
    } else if (direction === 'backward') {
      for (let i = 1; i < elements.length; i++) {
        if (ids.has(elements[i].id) && !ids.has(elements[i - 1].id)) {
          [elements[i - 1], elements[i]] = [elements[i], elements[i - 1]];
        }
      }
    } else if (direction === 'forward') {
      for (let i = elements.length - 2; i >= 0; i--) {
        if (ids.has(elements[i].id) && !ids.has(elements[i + 1].id)) {
          [elements[i], elements[i + 1]] = [elements[i + 1], elements[i]];
        }
      }
    }
    api.updateScene({ elements });
  }

  /**
   * Duplicar: junto vão os textos vinculados às formas selecionadas, e os
   * vínculos (grupos, texto ↔ forma) são refeitos para os clones — senão o
   * clone continuaria preso ao original.
   */
  function handleDuplicate() {
    const api = apiRef.current;
    if (!api) return;
    const ids = getSelectedIds();
    const elements: ExcalidrawElement[] = api.getSceneElements();

    const chosen = new Set(ids);
    for (const el of elements) {
      if (el.isDeleted) continue;
      if (ids.has(el.id)) for (const b of el.boundElements ?? []) if (b.type === 'text') chosen.add(b.id);
    }
    const source = elements.filter((el) => chosen.has(el.id) && !el.isDeleted);

    const idMap = new Map<string, string>();
    const groupMap = new Map<string, string>();
    source.forEach((el) => idMap.set(el.id, generateId()));
    const mapGroup = (g: string) => {
      if (!groupMap.has(g)) groupMap.set(g, generateId());
      return groupMap.get(g)!;
    };

    const newSelection: Record<string, true> = {};
    const clones = source.map((el) => {
      const id = idMap.get(el.id)!;
      newSelection[id] = true;
      return {
        ...el,
        id,
        x: el.x + 12,
        y: el.y + 12,
        groupIds: (el.groupIds ?? []).map(mapGroup),
        containerId: el.containerId ? (idMap.get(el.containerId) ?? el.containerId) : el.containerId,
        boundElements: el.boundElements
          ? el.boundElements.filter((b: any) => idMap.has(b.id)).map((b: any) => ({ ...b, id: idMap.get(b.id)! }))
          : el.boundElements,
        version: 1,
        versionNonce: Math.floor(Math.random() * 2 ** 31),
        updated: Date.now(),
        seed: Math.floor(Math.random() * 2 ** 31),
      };
    });
    api.updateScene({
      elements: [...elements, ...clones],
      appState: { selectedElementIds: newSelection },
    });
  }

  function handleDelete() {
    const api = apiRef.current;
    if (!api) return;
    const ids = getSelectedIds();
    api.updateScene({
      elements: deleteElements(api.getSceneElements(), ids),
      appState: { selectedElementIds: {}, selectedGroupIds: {} },
    });
  }

  function handleSetLink() {
    const url = window.prompt('Link do elemento (URL):', '');
    if (url === null) return;
    bumpAndUpdate({ link: url || null });
  }

  /**
   * Aplica uma propriedade do painel: muda os elementos selecionados e o
   * padrão dos próximos (appState.currentItem*). Para fonte/tamanho espera a
   * fonte carregar antes, porque a largura do texto é medida no navegador.
   */
  async function handleChangeProperty(key: PropKey, value: string | number) {
    const api = apiRef.current;
    if (!api) return;
    if (key === 'fontFamily' || key === 'fontSize') {
      const st = api.getAppState();
      await ensureFontLoaded(
        key === 'fontFamily' ? Number(value) : Number(st.currentItemFontFamily ?? 5),
        key === 'fontSize' ? Number(value) : 20,
      );
    }
    const { elements, appState } = applyProperty(key, value, api.getSceneElements(), getSelectedIds());
    api.updateScene({ elements, appState });
  }

  /** Tamanho / espaçamento do texto formatado selecionado. */
  async function handleRichChange(key: 'fontSize' | 'lineHeight', value: number) {
    const api = apiRef.current;
    if (!api) return;
    const ids = [...getSelectedIds()].filter((id) => {
      const el = api.getSceneElements().find((e: ExcalidrawElement) => e.id === id);
      return el && isRichHolder(el);
    });
    await Promise.all(ids.map((id) => rebuildRich(id, (doc) => ({ ...doc, [key]: value }))));
  }

  function handleEditText() {
    const api = apiRef.current;
    if (!api) return;
    const target = resolveEditTarget(api.getSceneElements(), getSelectedIds());
    if (target) openEditor(target);
  }

  function handleAlign(mode: AlignMode) {
    const api = apiRef.current;
    if (!api) return;
    api.updateScene({ elements: alignElements(api.getSceneElements(), getSelectedIds(), mode) });
  }

  function handleDistribute(axis: 'horizontal' | 'vertical') {
    const api = apiRef.current;
    if (!api) return;
    api.updateScene({ elements: distributeElements(api.getSceneElements(), getSelectedIds(), axis) });
  }

  function handleGroup() {
    const api = apiRef.current;
    if (!api) return;
    const { elements, groupId } = groupElements(api.getSceneElements(), getSelectedIds());
    api.updateScene({ elements, appState: { selectedGroupIds: { [groupId]: true } } });
  }

  function handleUngroup() {
    const api = apiRef.current;
    if (!api) return;
    api.updateScene({
      elements: ungroupElements(api.getSceneElements(), getSelectedIds()),
      appState: { selectedGroupIds: {} },
    });
  }

  // Bloquear: o elemento fica travado no lugar e a seleção é desfeita, como no Excalidraw.
  function handleLock() {
    const api = apiRef.current;
    if (!api) return;
    api.updateScene({
      elements: lockElements(api.getSceneElements(), getSelectedIds()),
      appState: { selectedElementIds: {}, selectedGroupIds: {} },
    });
  }

  const propertiesPanel = panelState ? (
    <ElementContextPanel
      state={panelState}
      onChange={handleChangeProperty}
      onRichChange={handleRichChange}
      onEditText={handleEditText}
      onReorder={handleReorder}
      onAlign={handleAlign}
      onDistribute={handleDistribute}
      onGroup={handleGroup}
      onUngroup={handleUngroup}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onSetLink={handleSetLink}
      onLock={handleLock}
    />
  ) : null;

  return (
    <div
      ref={layerRef}
      className={`excalidraw-layer ${active ? 'excalidraw-layer--active' : 'excalidraw-layer--hidden'} ${
        canvasLocked ? 'excalidraw-layer--locked' : ''
      }`}
    >
      <Excalidraw
        excalidrawAPI={handleExcalidrawApi}
        onChange={handleChange as any}
        initialData={{ appState: { viewBackgroundColor: 'transparent' } }}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            toggleTheme: false,
          },
        }}
      />
      {active && richArmed && <div className="rich-capture" onPointerDown={handleCapturePointerDown} />}
      {active &&
        toolbarSlot &&
        createPortal(
          <DrawToolbar
            activeTool={richArmed ? 'richtext' : activeTool}
            toolLocked={toolLocked}
            canvasLocked={canvasLocked}
            onSelectTool={handleSelectTool}
            onToggleLock={handleToggleLock}
            onToggleCanvasLock={handleToggleCanvasLock}
            onAddStickyNote={handleAddStickyNote}
            onUndo={() => sendUndoShortcut(false)}
            onRedo={() => sendUndoShortcut(true)}
            paperStyle={paperStyle}
            paperLineSpacing={paperLineSpacing}
            onPaperLineSpacingChange={onPaperLineSpacingChange}
          />,
          toolbarSlot,
        )}
      {active && panelState && (panelContainer ? createPortal(propertiesPanel, panelContainer) : propertiesPanel)}
      {active && editor && (
        <RichTextEditor
          key={editor.key}
          doc={editor.doc}
          anchor={editor.anchor}
          mode={editor.mode}
          panelContainer={editorContainer}
          onCommit={commitEditor}
          onCancel={cancelEditor}
        />
      )}
    </div>
  );
}
