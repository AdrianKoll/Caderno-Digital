import {
  ClipboardEvent as ReactClipboardEvent,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { HUES } from '../excalidraw/colorPalette';
import { TextAlignIcon } from '../excalidraw/panelIcons';
import { Stepper } from './Stepper';
import { MARKERS } from './markers';
import { docToHtml, htmlToParas, normalizeEditor, refreshBlocks, rgbToHex } from './htmlConvert';
import { INDENT_UNIT, MARKER_COL, PAD, SYMBOL_STACK, familyCss } from './render';
import {
  Align,
  MAX_FONT_SIZE,
  MAX_INDENT,
  MAX_LINE_HEIGHT,
  MIN_FONT_SIZE,
  MIN_LINE_HEIGHT,
  MarkerKind,
  RichDoc,
} from './types';
import './RichTextEditor.css';

export interface EditorAnchor {
  /** Posição do canto superior esquerdo do bloco, em pixels da tela. */
  left: number;
  top: number;
  /** Largura do bloco em pixels da tela (já com o zoom). */
  width: number;
  zoom: number;
}

interface Props {
  doc: RichDoc;
  anchor: EditorAnchor;
  /** Texto dentro de forma: centralizado por padrão. */
  mode: 'free' | 'shape';
  /** Coluna à esquerda da folha: em telas largas a barra de formatação vira um painel lá (fora da folha). */
  panelContainer?: HTMLElement | null;
  onCommit: (doc: RichDoc) => void;
  onCancel: () => void;
}

const FONTS = [
  { value: 5, title: 'Manuscrita' },
  { value: 6, title: 'Normal' },
  { value: 8, title: 'Código' },
];

const FIRST_ROW = ['#1e1e1e', '#ffffff'];

/**
 * Editor de texto formatado (abre por cima da folha, na posição do bloco).
 *
 * Um único bloco de texto com: sublinhado, cor por
 * palavra/letra, biblioteca de marcadores (bolinhas, numeração, letras,
 * romanos...), recuo, alinhamento, fonte, tamanho da fonte (com contador) e
 * espaço entre linhas. Ao concluir, o resultado é desenhado na folha (ver
 * render.ts) — o que aparece aqui é o que fica lá.
 */
export function RichTextEditor({ doc: initial, anchor, mode, panelContainer, onCommit, onCancel }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const doneRef = useRef(false);

  // Painel lateral (telas largas) ou barra flutuante no topo (celular/tablet estreito). Decidido ao abrir.
  const [docked] = useState(() => !!panelContainer && window.matchMedia('(min-width: 901px)').matches);
  // Celular/tablet em pé: a barra vira uma DOCA no pé da tela, logo acima do teclado.
  const [mobileDock] = useState(() => !docked && window.matchMedia('(max-width: 900px)').matches);

  const [fontFamily, setFontFamily] = useState(initial.fontFamily);
  const [fontSize, setFontSize] = useState(initial.fontSize);
  const [lineHeight, setLineHeight] = useState(initial.lineHeight);
  const [align, setAlign] = useState<Align>(initial.align);
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, color: initial.color });
  const [menu, setMenu] = useState<null | 'color' | 'marker'>(null);
  const [menuTop, setMenuTop] = useState(0);
  const [vvTop, setVvTop] = useState(0);
  const [vvBottom, setVvBottom] = useState(0); // altura do teclado virtual (distância do pé da tela visível)
  const [dockH, setDockH] = useState(0);
  const dockHRef = useRef(0);
  dockHRef.current = dockH;
  const [shiftY, setShiftY] = useState(0);

  // ------------------------------------------------------------------
  // Montagem: conteúdo inicial, foco e cursor no fim
  // ------------------------------------------------------------------
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = docToHtml(initial);
    refreshBlocks(root);
    root.focus();
    const range = document.createRange();
    range.selectNodeContents(root.lastElementChild ?? root);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    savedRange.current = range.cloneRange();
    try {
      document.execCommand('defaultParagraphSeparator', false, 'div');
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      /* navegador sem execCommand: os botões de formato ficam sem efeito */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readFormat = useCallback(() => {
    try {
      setFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        color: rgbToHex(document.queryCommandValue('foreColor')) ?? initial.color,
      });
    } catch {
      /* ignora */
    }
  }, [initial.color]);

  // Guarda a seleção (o toque em botões pode tirar o foco) e atualiza B/I/U/cor.
  useEffect(() => {
    const onSel = () => {
      const root = rootRef.current;
      const sel = window.getSelection();
      if (!root || !sel || sel.rangeCount === 0 || !root.contains(sel.anchorNode)) return;
      savedRange.current = sel.getRangeAt(0).cloneRange();
      readFormat();
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [readFormat]);

  // Teclado virtual (celular): mantém a barra visível e o texto acima do teclado (e da doca).
  const updateShift = useCallback(() => {
    const vv = window.visualViewport;
    const root = rootRef.current;
    if (!vv || !root) return;
    setVvTop(vv.offsetTop);
    setVvBottom(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    const keyboard = vv.height < window.innerHeight - 120;
    if (!keyboard && !mobileDock) {
      setShiftY(0);
      return;
    }
    const dock = mobileDock ? dockHRef.current : 0;
    const rect = root.getBoundingClientRect();
    const naturalTop = rect.top + shiftYRef.current;
    const naturalBottom = rect.bottom + shiftYRef.current;
    const visibleBottom = vv.offsetTop + vv.height - dock - 12;
    const need = Math.max(0, naturalBottom - visibleBottom);
    const room = Math.max(0, naturalTop - (vv.offsetTop + (mobileDock ? 56 : 120)));
    setShiftY(Math.min(need, room));
  }, [mobileDock]);
  const shiftYRef = useRef(0);
  shiftYRef.current = shiftY;

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    updateShift();
    vv.addEventListener('resize', updateShift);
    vv.addEventListener('scroll', updateShift);
    return () => {
      vv.removeEventListener('resize', updateShift);
      vv.removeEventListener('scroll', updateShift);
    };
  }, [updateShift]);

  // Altura da doca: o texto sobe para não ficar embaixo dela, e o menu abre logo acima.
  useEffect(() => {
    if (!mobileDock) return;
    const el = toolbarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => setDockH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobileDock]);
  useEffect(() => {
    if (mobileDock) updateShift();
  }, [dockH, mobileDock, updateShift]);

  // ------------------------------------------------------------------
  // Comandos
  // ------------------------------------------------------------------
  function restoreSelection() {
    const root = rootRef.current;
    if (!root) return;
    const sel = window.getSelection();
    if (savedRange.current && (!sel || sel.rangeCount === 0 || !root.contains(sel.anchorNode))) {
      root.focus();
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    } else {
      root.focus();
    }
  }

  function afterEdit() {
    const root = rootRef.current;
    if (!root) return;
    if (normalizeEditor(root)) {
      const range = document.createRange();
      range.selectNodeContents(root.lastElementChild ?? root);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    refreshBlocks(root);
    readFormat();
    updateShift();
  }

  function exec(cmd: string, value?: string) {
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand(cmd, false, value);
    } catch {
      /* ignora */
    }
    afterEdit();
  }

  function closestBlock(node: Node | null): HTMLElement | null {
    const root = rootRef.current;
    let n: Node | null = node;
    while (n && n.parentNode !== root) n = n.parentNode;
    return (n as HTMLElement) ?? null;
  }

  function selectedBlocks(): HTMLElement[] {
    const root = rootRef.current;
    if (!root) return [];
    const all = Array.from(root.children) as HTMLElement[];
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return all.slice(0, 1);
    const range = sel.getRangeAt(0);
    const a = closestBlock(range.startContainer);
    const b = closestBlock(range.endContainer);
    const i = a ? all.indexOf(a) : 0;
    const j = b ? all.indexOf(b) : i;
    return all.slice(Math.max(0, Math.min(i, j)), Math.max(i, j) + 1);
  }

  function setMarker(kind: MarkerKind) {
    restoreSelection();
    const root = rootRef.current;
    if (!root) return;
    normalizeEditor(root);
    const blocks = selectedBlocks();
    const allSame = blocks.length > 0 && blocks.every((b) => b.dataset.m === kind);
    blocks.forEach((b) => {
      b.dataset.m = allSame || kind === 'none' ? 'none' : kind;
    });
    setMenu(null);
    afterEdit();
  }

  function indent(delta: number) {
    restoreSelection();
    selectedBlocks().forEach((b) => {
      const next = Math.min(MAX_INDENT, Math.max(0, (parseInt(b.dataset.i || '0', 10) || 0) + delta));
      b.dataset.i = String(next);
    });
    afterEdit();
  }

  function openMenu(which: 'color' | 'marker') {
    if (menu === which) {
      setMenu(null);
      return;
    }
    const bar = toolbarRef.current?.getBoundingClientRect();
    setMenuTop((bar?.bottom ?? 60) + 6);
    setMenu(which);
  }

  function finish(cancel: boolean) {
    if (doneRef.current) return;
    doneRef.current = true;
    const root = rootRef.current;
    if (cancel || !root) {
      onCancel();
      return;
    }
    const paras = htmlToParas(root, initial.color);
    onCommit({ ...initial, paras, fontFamily, fontSize, lineHeight, align });
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      finish(false);
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      finish(false);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      indent(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.key === 'Backspace') {
      // No começo de um parágrafo com marcador, o primeiro Backspace tira o marcador (como no Word).
      const sel = window.getSelection();
      if (sel && sel.isCollapsed && sel.rangeCount) {
        const block = closestBlock(sel.anchorNode);
        if (block && block.dataset.m !== 'none') {
          const r = document.createRange();
          r.selectNodeContents(block);
          r.setEnd(sel.anchorNode!, sel.anchorOffset);
          if (r.toString() === '') {
            e.preventDefault();
            block.dataset.m = 'none';
            afterEdit();
          }
        }
      }
    }
  }

  function onPaste(e: ReactClipboardEvent<HTMLDivElement>) {
    // Sem isso o Excalidraw (que ouve o documento inteiro) colaria o texto também na folha.
    e.stopPropagation();
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain').replace(/\r/g, '');
    text.split('\n').forEach((line, i) => {
      if (i > 0) document.execCommand('insertParagraph');
      if (line) document.execCommand('insertText', false, line);
    });
    afterEdit();
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  const keep = { onMouseDown: (e: ReactMouseEvent) => e.preventDefault() };
  const z = anchor.zoom;
  const boxStyle = {
    left: anchor.left,
    top: anchor.top,
    width: anchor.width,
    transform: shiftY ? `translateY(${-shiftY}px)` : undefined,
    '--fs': `${fontSize * z}px`,
    '--pad': `${PAD * z}px`,
    '--lh': String(lineHeight),
    '--indent': String(INDENT_UNIT),
    '--mcol': String(MARKER_COL),
    '--sym': SYMBOL_STACK,
    fontFamily: familyCss(fontFamily),
    textAlign: align,
    color: initial.color,
  } as CSSProperties;

  const barStyle = {
    '--vv-top': `${vvTop}px`,
    '--vv-bottom': `${vvBottom}px`,
    // Com o teclado aberto a doca encosta nele; sem teclado, respeita a barra de gestos.
    '--dock-pad-b': vvBottom > 0 ? '0px' : 'var(--safe-bottom, 0px)',
  } as CSSProperties;

  // Onde e como os menus de cor/marcadores aparecem: dentro do painel, como folha acima da doca, ou flutuando.
  const menuView = docked
    ? { className: 'rte-menu rte-menu--inline', style: undefined }
    : mobileDock
      ? { className: 'rte-menu rte-menu--sheet', style: { bottom: vvBottom + dockH + 8 } as CSSProperties }
      : { className: 'rte-menu', style: { top: menuTop } as CSSProperties };

  const swatch = (color: string, title?: string) => (
    <button
      key={color}
      type="button"
      title={title ?? color}
      className={`rte-swatch ${color === '#ffffff' ? 'is-light' : ''} ${fmt.color === color ? 'is-active' : ''}`}
      style={{ background: color }}
      {...keep}
      onClick={() => {
        exec('foreColor', color);
        setMenu(null);
      }}
    />
  );

  const colorMenu = menu === 'color' && (
    <div className={menuView.className} style={menuView.style} {...keep}>
      <div className="rte-menu__title">Cor do texto</div>
      <div className="rte-menu__row">
        <button
          type="button"
          className="rte-auto"
          {...keep}
          onClick={() => {
            exec('foreColor', initial.color);
            setMenu(null);
          }}
        >
          Automática
        </button>
        {FIRST_ROW.map((c) => swatch(c, c === '#ffffff' ? 'Branco' : 'Preto'))}
      </div>
      <div className="rte-palette">
        {[4, 3, 2, 1, 0].map((shade) => HUES.map((h) => swatch(h.shades[shade], `${h.label} ${5 - shade}`)))}
      </div>
    </div>
  );

  const markerMenu = menu === 'marker' && (
    <div className={menuView.className} style={menuView.style} {...keep}>
      <div className="rte-menu__title">Marcadores</div>
      <div className="rte-markers rte-markers--bullets">
        {MARKERS.filter((m) => m.group === 'bullet').map((m) => (
          <button key={m.kind} type="button" title={m.label} className="rte-marker" {...keep} onClick={() => setMarker(m.kind)}>
            <span style={{ fontFamily: SYMBOL_STACK }}>{m.sample}</span>
          </button>
        ))}
      </div>
      <div className="rte-menu__title">Numeração</div>
      <div className="rte-markers rte-markers--numbers">
        {MARKERS.filter((m) => m.group === 'number').map((m) => (
          <button key={m.kind} type="button" title={m.label} className="rte-marker rte-marker--wide" {...keep} onClick={() => setMarker(m.kind)}>
            {m.label}
          </button>
        ))}
      </div>
      <button type="button" className="rte-auto rte-auto--block" {...keep} onClick={() => setMarker('none')}>
        Sem marcador
      </button>
    </div>
  );

  const toolbar = (
    <div
      className={`rte-toolbar ${docked ? 'rte-toolbar--docked' : ''} ${mobileDock ? 'rte-toolbar--dock' : ''}`}
      ref={toolbarRef}
      style={docked ? undefined : barStyle}
      role="toolbar"
      aria-label="Formatação do texto"
    >
      {docked && <div className="rte-panel-title">Editar texto</div>}

      <div className="rte-group rte-group--actions">
        <button type="button" title="Cancelar (descarta as mudanças)" aria-label="Cancelar" className="rte-btn rte-btn--ghost" {...keep} onClick={() => finish(true)}>
          <i className="bi bi-x-lg" />
        </button>
        <button type="button" title="Concluir (Ctrl+Enter)" aria-label="Concluir" className="rte-btn rte-btn--done" {...keep} onClick={() => finish(false)}>
          <i className="bi bi-check-lg" />
          <span>Concluir</span>
        </button>
      </div>

      <div className="rte-group" role="group" aria-label="Estilo">
        {docked && <span className="rte-group__label">Estilo</span>}
        <button type="button" title="Negrito (Ctrl+B)" aria-label="Negrito" aria-pressed={fmt.bold} className={`rte-btn ${fmt.bold ? 'is-active' : ''}`} {...keep} onClick={() => exec('bold')}>
          <b>B</b>
        </button>
        <button type="button" title="Itálico (Ctrl+I)" aria-label="Itálico" aria-pressed={fmt.italic} className={`rte-btn ${fmt.italic ? 'is-active' : ''}`} {...keep} onClick={() => exec('italic')}>
          <i style={{ fontFamily: 'serif' }}>I</i>
        </button>
        <button type="button" title="Sublinhado (Ctrl+U)" aria-label="Sublinhado" aria-pressed={fmt.underline} className={`rte-btn ${fmt.underline ? 'is-active' : ''}`} {...keep} onClick={() => exec('underline')}>
          <u>U</u>
        </button>
        <button type="button" title="Cor do texto" aria-label="Cor do texto" className={`rte-btn rte-btn--color ${menu === 'color' ? 'is-active' : ''}`} {...keep} onClick={() => openMenu('color')}>
          <span className="rte-color-a">A</span>
          <span className="rte-color-bar" style={{ background: fmt.color }} />
        </button>
      </div>
      {docked && colorMenu}

      <div className="rte-group" role="group" aria-label="Parágrafo">
        {docked && <span className="rte-group__label">Parágrafo</span>}
        <button type="button" title="Marcadores e numeração" aria-label="Marcadores e numeração" className={`rte-btn ${menu === 'marker' ? 'is-active' : ''}`} {...keep} onClick={() => openMenu('marker')}>
          <i className="bi bi-list-ul" />
        </button>
        <button type="button" title="Diminuir recuo (Shift+Tab)" aria-label="Diminuir recuo" className="rte-btn" {...keep} onClick={() => indent(-1)}>
          <i className="bi bi-text-indent-right" />
        </button>
        <button type="button" title="Aumentar recuo (Tab)" aria-label="Aumentar recuo" className="rte-btn" {...keep} onClick={() => indent(1)}>
          <i className="bi bi-text-indent-left" />
        </button>
        {(['left', 'center', 'right'] as Align[]).map((a) => (
          <button
            key={a}
            type="button"
            title={a === 'left' ? 'Alinhar à esquerda' : a === 'center' ? 'Centralizar' : 'Alinhar à direita'}
            aria-label={a === 'left' ? 'Alinhar à esquerda' : a === 'center' ? 'Centralizar' : 'Alinhar à direita'}
            className={`rte-btn ${align === a ? 'is-active' : ''}`}
            {...keep}
            onClick={() => setAlign(a)}
          >
            <TextAlignIcon align={a} />
          </button>
        ))}
      </div>
      {docked && markerMenu}

      <div className="rte-group" role="group" aria-label="Fonte">
        {docked && <span className="rte-group__label">Fonte</span>}
        {FONTS.map((f) => (
          <button
            key={f.value}
            type="button"
            title={f.title}
            aria-label={f.title}
            className={`rte-btn ${fontFamily === f.value ? 'is-active' : ''}`}
            style={{ fontFamily: familyCss(f.value) }}
            {...keep}
            onClick={() => setFontFamily(f.value)}
          >
            {f.value === 8 ? '</>' : 'Aa'}
          </button>
        ))}
      </div>

      <div className="rte-group rte-group--steppers" role="group" aria-label="Medidas">
        <label className="rte-field" title="Tamanho do texto">
          <i className="bi bi-fonts" aria-hidden="true" />
          <span className="rte-field__label">Tamanho</span>
          <Stepper
            keepFocus
            ariaLabel="tamanho do texto"
            value={fontSize}
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={1}
            onChange={setFontSize}
          />
        </label>
        <label className="rte-field" title="Espaço entre linhas">
          <i className="bi bi-text-paragraph" aria-hidden="true" />
          <span className="rte-field__label">Entre linhas</span>
          <Stepper
            keepFocus
            ariaLabel="espaço entre linhas"
            value={lineHeight}
            min={MIN_LINE_HEIGHT}
            max={MAX_LINE_HEIGHT}
            step={0.05}
            decimals={2}
            onChange={setLineHeight}
          />
        </label>
      </div>
    </div>
  );

  return createPortal(
    <>
      <div className="rte-backdrop" onPointerDown={() => finish(false)} />

      {docked && panelContainer ? createPortal(toolbar, panelContainer) : toolbar}
      {!docked && colorMenu}
      {!docked && markerMenu}

      <div
        ref={rootRef}
        className={`rte-box rte-box--${mode}`}
        style={boxStyle}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-multiline="true"
        aria-label="Texto"
        onKeyDown={onKeyDown}
        onKeyUp={(e) => e.stopPropagation()}
        onCopy={(e) => e.stopPropagation()}
        onCut={(e) => e.stopPropagation()}
        onInput={afterEdit}
        onPaste={onPaste}
        onFocus={readFormat}
      />
    </>,
    document.body,
  );
}
