<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import { Icon, IconName } from './icons';
import { DOCK_QUERY } from '../../hooks/useMediaQuery';
import { DockPageButtons } from './DockPageButtons';
import { PaperStyle } from '../../types';
=======
import { useEffect, useRef, useState } from 'react';
import { Icon, IconName } from './icons';
import { DOCK_QUERY } from '../../hooks/useMediaQuery';
>>>>>>> origin/main
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

<<<<<<< HEAD
/** Ícone de traço fino (desfazer / refazer na doca do celular). */
function StrokeIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

=======
>>>>>>> origin/main
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
<<<<<<< HEAD
  paperStyle: PaperStyle;
  paperLineSpacing: number;
  onPaperLineSpacingChange: (spacing: number) => void;
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
  paperStyle,
  paperLineSpacing,
  onPaperLineSpacingChange,
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
=======
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
>>>>>>> origin/main
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
<<<<<<< HEAD
    const active = wrapRef.current?.querySelector<HTMLElement>('.draw-toolbar__btn--tool.is-active');
=======
    const active = wrapRef.current?.querySelector<HTMLElement>('.draw-toolbar__group .is-active');
>>>>>>> origin/main
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTool]);

  // Fecha o menu ao clicar fora ou apertar Esc.
  useEffect(() => {
<<<<<<< HEAD
    if (!moreOpen && !spacingOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
        setSpacingOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false);
        setSpacingOpen(false);
      }
=======
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
>>>>>>> origin/main
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
<<<<<<< HEAD
  }, [moreOpen, spacingOpen]);

  const moreActive = moreOpen || MORE_TOOLS.some((t) => t.type === activeTool) || canvasLocked;

  useEffect(() => {
    if (paperStyle !== 'ruled') setSpacingOpen(false);
  }, [paperStyle]);

=======
  }, [moreOpen]);

  const moreActive = moreOpen || MORE_TOOLS.some((t) => t.type === activeTool) || canvasLocked;

>>>>>>> origin/main
  const toolButton = (tool: Tool) => (
    <button
      key={tool.type}
      type="button"
      title={tool.title}
      aria-label={tool.title}
<<<<<<< HEAD
      className={`draw-toolbar__btn draw-toolbar__btn--tool ${activeTool === tool.type ? 'is-active' : ''}`}
      onClick={() => {
        setSpacingOpen(false);
        onSelectTool(tool.type);
      }}
=======
      className={`draw-toolbar__btn ${activeTool === tool.type ? 'is-active' : ''}`}
      onClick={() => onSelectTool(tool.type)}
>>>>>>> origin/main
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

<<<<<<< HEAD
      <div className="draw-toolbar__row">
      {/* Doca: desfazer/refazer ficam fixos à esquerda (no computador esta lateral é escondida por CSS). */}
      <div className="draw-toolbar__side draw-toolbar__side--left">
        <button type="button" title="Desfazer" aria-label="Desfazer" className="draw-toolbar__btn draw-toolbar__btn--mobile" onClick={onUndo}>
          <StrokeIcon>
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
          </StrokeIcon>
        </button>
        <button type="button" title="Refazer" aria-label="Refazer" className="draw-toolbar__btn draw-toolbar__btn--mobile" onClick={onRedo}>
          <StrokeIcon>
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13" />
          </StrokeIcon>
        </button>
      </div>

=======
>>>>>>> origin/main
      <div className="draw-toolbar__group">
        <button
          type="button"
          title={toolLocked ? 'Manter ferramenta ativa (ligado)' : 'Manter ferramenta ativa'}
          aria-label="Manter ferramenta ativa"
          aria-pressed={toolLocked}
          className={`draw-toolbar__btn ${toolLocked ? 'is-active' : ''}`}
          onClick={onToggleLock}
        >
<<<<<<< HEAD
          {/* Computador: cadeado cheio; celular: cadeado de contorno (CSS troca os dois). */}
          <span className="draw-toolbar__ico draw-toolbar__ico--solid">
            <Icon name={toolLocked ? 'lock' : 'lockOpen'} />
          </span>
          <span className="draw-toolbar__ico draw-toolbar__ico--outline">
            <Icon name={toolLocked ? 'lockOutline' : 'lockOpenOutline'} />
          </span>
=======
          <Icon name={toolLocked ? 'lock' : 'lockOpen'} />
>>>>>>> origin/main
        </button>

        <div className="draw-toolbar__divider" />

        {TOOLS_BEFORE_ERASER.map(toolButton)}

        {toolButton({ type: 'eraser', icon: 'eraser', title: 'Borracha' })}

<<<<<<< HEAD
        <button
          type="button"
          title={paperStyle === 'ruled' ? 'Espaçamento das pautas' : 'Disponível apenas na folha pautada'}
          aria-label="Espaçamento das pautas"
          aria-expanded={spacingOpen}
          aria-pressed={spacingOpen}
          disabled={paperStyle !== 'ruled'}
          className={`draw-toolbar__btn draw-toolbar__btn--spacing ${spacingOpen ? 'is-active' : ''}`}
          onClick={() => {
            setMoreOpen(false);
            setSpacingOpen((open) => !open);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 5h12M8 10h12M8 15h12M8 20h12" />
            <path d="M4 7V4m0 0L2.5 5.5M4 4l1.5 1.5M4 17v3m0 0-1.5-1.5M4 20l1.5-1.5" />
          </svg>
        </button>

=======
>>>>>>> origin/main
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
<<<<<<< HEAD
          onClick={() => {
            setSpacingOpen(false);
            setMoreOpen((v) => !v);
          }}
        >
          <Icon name="more" />
        </button>
      </div>

      {/* Doca: voltar / avançar de página, fixos à direita. */}
      <div className="draw-toolbar__side draw-toolbar__side--right">
        <DockPageButtons />
      </div>
      </div>

      {spacingOpen && paperStyle === 'ruled' && (
        <section className="draw-toolbar__spacing-panel" aria-label="Controle do espaçamento das pautas">
          <div className="draw-toolbar__spacing-heading">
            <label htmlFor="draw-toolbar-paper-spacing">Espaçamento das pautas</label>
            <output htmlFor="draw-toolbar-paper-spacing">{paperLineSpacing} px</output>
          </div>
          <input
            id="draw-toolbar-paper-spacing"
            type="range"
            min="18"
            max="60"
            step="2"
            value={paperLineSpacing}
            aria-label="Espaçamento entre as linhas da pauta"
            aria-valuetext={`${paperLineSpacing} pixels`}
            onChange={(event) => onPaperLineSpacingChange(Number(event.currentTarget.value))}
          />
          <div className="draw-toolbar__spacing-range-labels" aria-hidden="true">
            <span>Mais próximas</span>
            <span>Mais afastadas</span>
          </div>
        </section>
      )}
=======
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
>>>>>>> origin/main

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
