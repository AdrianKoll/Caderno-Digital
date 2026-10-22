import { useEffect, useRef, useState } from 'react';
import { Icon, IconName } from './icons';
import { DOCK_QUERY } from '../../hooks/useMediaQuery';
import './DrawToolbar.css';

interface Tool {
  type: string;
  icon: IconName;
  title: string;
}

// Ordem definida no pedido: cadeado, mão, seleção, retângulo, losango,
// elipse, seta, linha, lápis, texto, borracha, sticky note e o menu "mais
// ferramentas". O "Texto" cria texto formatado (ver richtext/). `type` precisa bater exatamente com os tipos
// aceitos por `excalidrawAPI.setActiveTool({ type })` — essa é a única
// "conversa" desta barra com o Excalidraw, então não depende de nenhuma
// classe CSS interna da lib.
const TOOLS_BEFORE_ERASER: Tool[] = [
  { type: 'hand', icon: 'hand', title: 'Mover (mão)' },
  { type: 'selection', icon: 'select', title: 'Selecionar' },
  { type: 'rectangle', icon: 'rectangle', title: 'Retângulo' },
  { type: 'diamond', icon: 'diamond', title: 'Losango' },
  { type: 'ellipse', icon: 'ellipse', title: 'Elipse' },
  { type: 'arrow', icon: 'arrow', title: 'Seta' },
  { type: 'line', icon: 'line', title: 'Linha' },
  { type: 'freedraw', icon: 'pencil', title: 'Lápis' },
  { type: 'richtext', icon: 'text', title: 'Texto (cores por letra, marcadores...)' },
];

// Ferramentas dentro do menu "três pontinhos".
const MORE_TOOLS: Tool[] = [
  { type: 'image', icon: 'image', title: 'Inserir imagem' },
  { type: 'frame', icon: 'frame', title: 'Ferramenta de quadro' },
  { type: 'laser', icon: 'laser', title: 'Ponteiro laser' },
];

interface Props {
  activeTool: string;
  toolLocked: boolean;
  canvasLocked: boolean;
  onSelectTool: (tool: string) => void;
  onToggleLock: () => void;
  onToggleCanvasLock: () => void;
  onAddStickyNote: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * Barra de ferramentas do desenho, fora da folha (canto direito da tela).
 * Substitui a barra nativa do Excalidraw (escondida via CSS — ver
 * ExcalidrawLayer.css) para não depender de detalhes internos da lib.
 */
export function DrawToolbar({
  activeTool,
  toolLocked,
  canvasLocked,
  onSelectTool,
  onToggleLock,
  onToggleCanvasLock,
  onAddStickyNote,
  onUndo,
  onRedo,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  // Só tem efeito na doca (a alça de recolher é escondida por CSS quando a barra está no topo).
  const [collapsed, setCollapsed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Publica a altura da DOCA numa variável CSS (--mobile-toolbar-h) para que a
  // folha, o painel de propriedades e o seletor de símbolos terminem logo acima
  // dela, seja qual for o tamanho da tela ou o estado (recolhida). Quando a barra
  // está no topo (>= 1180px) ela não ocupa o pé da tela, então vale 0.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const mq = window.matchMedia(DOCK_QUERY);
    const update = () => root.style.setProperty('--mobile-toolbar-h', mq.matches ? `${el.offsetHeight + 8}px` : '0px');
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    mq.addEventListener('change', update);
    return () => {
      observer.disconnect();
      mq.removeEventListener('change', update);
      root.style.removeProperty('--mobile-toolbar-h');
    };
  }, []);

  // Doca (<= 1179px): ela rola; mantém a ferramenta ativa à vista.
  useEffect(() => {
    if (!window.matchMedia(DOCK_QUERY).matches) return;
    const active = wrapRef.current?.querySelector<HTMLElement>('.draw-toolbar__group .is-active');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTool]);

  // Fecha o menu ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const moreActive = moreOpen || MORE_TOOLS.some((t) => t.type === activeTool) || canvasLocked;

  const toolButton = (tool: Tool) => (
    <button
      key={tool.type}
      type="button"
      title={tool.title}
      aria-label={tool.title}
      className={`draw-toolbar__btn ${activeTool === tool.type ? 'is-active' : ''}`}
      onClick={() => onSelectTool(tool.type)}
    >
      <Icon name={tool.icon} />
    </button>
  );

  return (
    <div className={`draw-toolbar ${collapsed ? 'is-collapsed' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="draw-toolbar__handle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Mostrar ferramentas' : 'Recolher ferramentas'}
        onClick={() => {
          setMoreOpen(false);
          setCollapsed((v) => !v);
        }}
      >
        <i className={`bi ${collapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
        {collapsed ? 'Mostrar ferramentas' : 'Recolher'}
      </button>

      <div className="draw-toolbar__group">
        <button
          type="button"
          title={toolLocked ? 'Manter ferramenta ativa (ligado)' : 'Manter ferramenta ativa'}
          aria-label="Manter ferramenta ativa"
          aria-pressed={toolLocked}
          className={`draw-toolbar__btn ${toolLocked ? 'is-active' : ''}`}
          onClick={onToggleLock}
        >
          <Icon name={toolLocked ? 'lock' : 'lockOpen'} />
        </button>

        <div className="draw-toolbar__divider" />

        {TOOLS_BEFORE_ERASER.map(toolButton)}

        {toolButton({ type: 'eraser', icon: 'eraser', title: 'Borracha' })}

        <div className="draw-toolbar__divider" />

        <button
          type="button"
          title="Sticky note"
          aria-label="Sticky note"
          className="draw-toolbar__btn"
          onClick={() => {
            setMoreOpen(false);
            onAddStickyNote();
          }}
        >
          <Icon name="sticky" />
        </button>

        <button
          type="button"
          title="Mais ferramentas"
          aria-label="Mais ferramentas"
          aria-expanded={moreOpen}
          className={`draw-toolbar__btn ${moreActive ? 'is-active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <Icon name="more" />
        </button>

        {/* Só no celular (sem teclado para Ctrl+Z): a barra nativa com
            desfazer/refazer é escondida, então eles moram aqui. */}
        <button type="button" title="Desfazer" aria-label="Desfazer" className="draw-toolbar__btn draw-toolbar__btn--mobile" onClick={onUndo}>
          <i className="bi bi-arrow-counterclockwise" />
        </button>
        <button type="button" title="Refazer" aria-label="Refazer" className="draw-toolbar__btn draw-toolbar__btn--mobile" onClick={onRedo}>
          <i className="bi bi-arrow-clockwise" />
        </button>
      </div>

      {moreOpen && (
        <div className="draw-toolbar__menu" role="menu">
          {MORE_TOOLS.map((tool) => (
            <button
              key={tool.type}
              type="button"
              role="menuitem"
              className={`draw-toolbar__menu-item ${activeTool === tool.type ? 'is-active' : ''}`}
              onClick={() => {
                onSelectTool(tool.type);
                setMoreOpen(false);
              }}
            >
              <Icon name={tool.icon} />
              <span>{tool.title}</span>
            </button>
          ))}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={canvasLocked}
            className={`draw-toolbar__menu-item ${canvasLocked ? 'is-active' : ''}`}
            onClick={onToggleCanvasLock}
          >
            <Icon name={canvasLocked ? 'lockOutline' : 'lockOpenOutline'} />
            <span>{canvasLocked ? 'Destravar tela' : 'Travar tela'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
