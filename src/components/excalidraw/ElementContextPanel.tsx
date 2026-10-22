import { CSSProperties, ReactNode, useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { Stepper } from '../richtext/Stepper';
import { MAX_FONT_SIZE, MAX_LINE_HEIGHT, MIN_FONT_SIZE, MIN_LINE_HEIGHT } from '../richtext/types';
import { BACKGROUND_TOP_PICKS, STROKE_TOP_PICKS } from './colorPalette';
import {
  ARROWHEADS,
  AlignMode,
  FILL_STYLES,
  FONT_MORE,
  FONT_PRIMARY,
  PanelState,
  PropKey,
  ROUGHNESS,
  STROKE_STYLES,
  STROKE_WIDTHS,
} from './propertyModel';
import {
  AlignIcon,
  ArrowTypeIcon,
  ArrowheadIcon,
  DistributeIcon,
  DuplicateIcon,
  EdgesIcon,
  FillIcon,
  GroupIcon,
  LayerIcon,
  LinkIcon,
  LockIcon,
  MoreFontsIcon,
  RoughnessIcon,
  StrokeStyleIcon,
  StrokeWidthIcon,
  TextAlignIcon,
  TrashIcon,
  UngroupIcon,
  VerticalAlignIcon,
} from './panelIcons';
import './ElementContextPanel.css';

interface Props {
  state: PanelState;
  onChange: (key: PropKey, value: string | number) => void;
  /** Tamanho / espaçamento do texto formatado selecionado. */
  onRichChange: (key: 'fontSize' | 'lineHeight', value: number) => void;
  /** Abre o editor de texto formatado para a seleção. */
  onEditText: () => void;
  onReorder: (direction: 'toBack' | 'backward' | 'forward' | 'toFront') => void;
  onAlign: (mode: AlignMode) => void;
  onDistribute: (axis: 'horizontal' | 'vertical') => void;
  onGroup: () => void;
  onUngroup: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetLink: () => void;
  onLock: () => void;
}

interface Option<T> {
  value: T;
  title: string;
  content: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Grupo de botões de escolha única (o "radio" de ícones do Excalidraw). */
function ButtonGroup<T extends string | number>({
  value,
  options,
  onPick,
}: {
  value: T | null;
  options: Option<T>[];
  onPick: (v: T) => void;
}) {
  return (
    <div className="ecp-row">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.title}
          className={`ecp-btn ${value === o.value ? 'is-active' : ''} ${o.className ?? ''}`}
          style={o.style}
          onClick={() => onPick(o.value)}
        >
          {o.content}
        </button>
      ))}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ecp-section">
      <div className="ecp-label">{label}</div>
      {children}
    </div>
  );
}

function ActionButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" title={title} className="ecp-btn" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * Caixa de edição de objetos: as mesmas seções e o mesmo comportamento do
 * painel de propriedades do Excalidraw (contorno, fundo, preenchimento,
 * espessura, estilo do traço, irregularidade, bordas, setas, texto,
 * opacidade, camadas, alinhamento e ações).
 *
 * Fica fixa numa coluna à direita da folha (ver ExcalidrawLayer.tsx). Quando
 * nada está selecionado mas uma ferramenta de desenho está ativa, edita os
 * valores padrão dos próximos elementos — igual ao Excalidraw.
 */
export function ElementContextPanel({
  state,
  onChange,
  onRichChange,
  onEditText,
  onReorder,
  onAlign,
  onDistribute,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  onSetLink,
  onLock,
}: Props) {
  const { show, values: v } = state;
  const [moreFonts, setMoreFonts] = useState(false);
  // Mobile: o painel vira uma gaveta recolhível acima da barra de ferramentas
  // (no desktop a alça fica escondida por CSS e o painel é sempre completo).
  const [expanded, setExpanded] = useState(false);
  const isSelection = state.mode === 'selection';
  const moreFontActive = FONT_MORE.some((f) => f.value === v.fontFamily);

  return (
    <div className={`element-context-panel ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button
        type="button"
        className="ecp-mobile-head"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>{isSelection ? 'Propriedades' : 'Estilo padrão'}</span>
        <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-up'}`} />
      </button>

      {show.stroke && (
        <ColorPicker
          label="Contorno"
          value={v.strokeColor}
          topPicks={STROKE_TOP_PICKS}
          onChange={(c) => onChange('strokeColor', c)}
        />
      )}

      {show.background && (
        <ColorPicker
          label="Fundo"
          value={v.backgroundColor}
          topPicks={BACKGROUND_TOP_PICKS}
          allowTransparent
          onChange={(c) => onChange('backgroundColor', c)}
        />
      )}

      {show.fill && (
        <Section label="Preenchimento">
          <ButtonGroup
            value={v.fillStyle}
            onPick={(f) => onChange('fillStyle', f)}
            options={FILL_STYLES.map((f) => ({ value: f.value, title: f.label, content: <FillIcon kind={f.value} /> }))}
          />
        </Section>
      )}

      {show.strokeWidth && (
        <Section label="Espessura do traço">
          <ButtonGroup
            value={v.strokeWidth}
            onPick={(w) => onChange('strokeWidth', w)}
            options={STROKE_WIDTHS.map((w) => ({ value: w.value, title: w.label, content: <StrokeWidthIcon width={w.value} /> }))}
          />
        </Section>
      )}

      {show.strokeStyle && (
        <Section label="Estilo do traço">
          <ButtonGroup
            value={v.strokeStyle}
            onPick={(s) => onChange('strokeStyle', s)}
            options={STROKE_STYLES.map((s) => ({ value: s.value, title: s.label, content: <StrokeStyleIcon style={s.value} /> }))}
          />
        </Section>
      )}

      {show.roughness && (
        <Section label="Irregularidade">
          <ButtonGroup
            value={v.roughness}
            onPick={(r) => onChange('roughness', r)}
            options={ROUGHNESS.map((r) => ({ value: r.value, title: r.label, content: <RoughnessIcon level={r.value} /> }))}
          />
        </Section>
      )}

      {show.edges && (
        <Section label="Bordas">
          <ButtonGroup
            value={v.edges}
            onPick={(e) => onChange('edges', e)}
            options={[
              { value: 'sharp' as const, title: 'Retas', content: <EdgesIcon kind="sharp" /> },
              { value: 'round' as const, title: 'Arredondadas', content: <EdgesIcon kind="round" /> },
            ]}
          />
        </Section>
      )}

      {show.arrowType && (
        <Section label="Tipo de seta">
          <ButtonGroup
            value={v.arrowType}
            onPick={(t) => onChange('arrowType', t)}
            options={[
              { value: 'sharp' as const, title: 'Seta reta', content: <ArrowTypeIcon kind="sharp" /> },
              { value: 'round' as const, title: 'Seta curva', content: <ArrowTypeIcon kind="round" /> },
            ]}
          />
        </Section>
      )}

      {show.arrowheads && (
        <Section label="Pontas da seta">
          <div className="ecp-sublabel">Início</div>
          <ButtonGroup
            value={v.startArrowhead}
            onPick={(a) => onChange('startArrowhead', a)}
            options={ARROWHEADS.map((a) => ({ value: a as string, title: a, content: <ArrowheadIcon kind={a} flip /> }))}
          />
          <div className="ecp-sublabel">Fim</div>
          <ButtonGroup
            value={v.endArrowhead}
            onPick={(a) => onChange('endArrowhead', a)}
            options={ARROWHEADS.map((a) => ({ value: a as string, title: a, content: <ArrowheadIcon kind={a} /> }))}
          />
        </Section>
      )}

      {show.text && (
        <>
          <Section label="Fonte">
            <div className="ecp-row">
              {FONT_PRIMARY.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  title={f.title}
                  className={`ecp-btn ecp-btn--font ${v.fontFamily === f.value ? 'is-active' : ''}`}
                  style={{ fontFamily: f.css }}
                  onClick={() => onChange('fontFamily', f.value)}
                >
                  {f.value === 8 ? '</>' : 'Aa'}
                </button>
              ))}
              <button
                type="button"
                title="Mais fontes"
                className={`ecp-btn ${moreFontActive ? 'is-active' : ''}`}
                onClick={() => setMoreFonts((o) => !o)}
              >
                <MoreFontsIcon />
              </button>
            </div>
            {moreFonts && (
              <div className="ecp-fontlist">
                {FONT_MORE.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`ecp-fontlist__item ${v.fontFamily === f.value ? 'is-active' : ''}`}
                    style={{ fontFamily: f.css }}
                    onClick={() => onChange('fontFamily', f.value)}
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section label="Tamanho do texto">
            <Stepper
              ariaLabel="tamanho do texto"
              value={v.fontSize}
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              onChange={(n) => onChange('fontSize', n)}
            />
          </Section>

          <Section label="Espaço entre linhas">
            <Stepper
              ariaLabel="espaço entre linhas"
              value={v.lineHeight}
              min={MIN_LINE_HEIGHT}
              max={MAX_LINE_HEIGHT}
              step={0.05}
              decimals={2}
              onChange={(n) => onChange('lineHeight', n)}
            />
          </Section>

          <Section label="Alinhamento do texto">
            <ButtonGroup
              value={v.textAlign}
              onPick={(a) => onChange('textAlign', a)}
              options={[
                { value: 'left', title: 'Alinhar à esquerda', content: <TextAlignIcon align="left" /> },
                { value: 'center', title: 'Centralizar', content: <TextAlignIcon align="center" /> },
                { value: 'right', title: 'Alinhar à direita', content: <TextAlignIcon align="right" /> },
              ]}
            />
          </Section>

          {show.verticalAlign && (
            <Section label="Alinhamento vertical">
              <ButtonGroup
                value={v.verticalAlign}
                onPick={(a) => onChange('verticalAlign', a)}
                options={[
                  { value: 'top', title: 'Alinhar ao topo', content: <VerticalAlignIcon align="top" /> },
                  { value: 'middle', title: 'Centralizar na vertical', content: <VerticalAlignIcon align="middle" /> },
                  { value: 'bottom', title: 'Alinhar embaixo', content: <VerticalAlignIcon align="bottom" /> },
                ]}
              />
            </Section>
          )}
        </>
      )}

      {(show.rich && state.rich) && (
        <>
          <Section label="Tamanho do texto">
            <Stepper
              ariaLabel="tamanho do texto"
              value={state.rich.fontSize}
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              onChange={(n) => onRichChange('fontSize', n)}
            />
          </Section>

          <Section label="Espaço entre linhas">
            <Stepper
              ariaLabel="espaço entre linhas"
              value={state.rich.lineHeight}
              min={MIN_LINE_HEIGHT}
              max={MAX_LINE_HEIGHT}
              step={0.05}
              decimals={2}
              onChange={(n) => onRichChange('lineHeight', n)}
            />
          </Section>
        </>
      )}

      {state.canEditText && (
        <button type="button" className="ecp-edit-text" onClick={onEditText}>
          <i className="bi bi-type" />
          <span>Editar texto</span>
          <small>cores, sublinhado, marcadores</small>
        </button>
      )}

      <Section label="Opacidade">
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={v.opacity ?? 100}
          onChange={(e) => onChange('opacity', Number(e.target.value))}
          className="ecp-slider"
        />
        <div className="ecp-row ecp-row--spread">
          <span>0</span>
          <span>{v.opacity === null ? '—' : v.opacity}</span>
        </div>
      </Section>

      {isSelection && (
        <>
          <Section label="Camadas">
            <div className="ecp-row">
              <ActionButton title="Enviar para trás (Ctrl+Shift+[)" onClick={() => onReorder('toBack')}>
                <LayerIcon kind="toBack" />
              </ActionButton>
              <ActionButton title="Recuar uma camada (Ctrl+[)" onClick={() => onReorder('backward')}>
                <LayerIcon kind="backward" />
              </ActionButton>
              <ActionButton title="Avançar uma camada (Ctrl+])" onClick={() => onReorder('forward')}>
                <LayerIcon kind="forward" />
              </ActionButton>
              <ActionButton title="Trazer para frente (Ctrl+Shift+])" onClick={() => onReorder('toFront')}>
                <LayerIcon kind="toFront" />
              </ActionButton>
            </div>
          </Section>

          {state.count > 1 && (
            <Section label="Alinhar">
              <div className="ecp-row">
                <ActionButton title="Alinhar à esquerda" onClick={() => onAlign('left')}>
                  <AlignIcon mode="left" />
                </ActionButton>
                <ActionButton title="Centralizar na horizontal" onClick={() => onAlign('centerH')}>
                  <AlignIcon mode="centerH" />
                </ActionButton>
                <ActionButton title="Alinhar à direita" onClick={() => onAlign('right')}>
                  <AlignIcon mode="right" />
                </ActionButton>
                <ActionButton title="Alinhar ao topo" onClick={() => onAlign('top')}>
                  <AlignIcon mode="top" />
                </ActionButton>
                <ActionButton title="Centralizar na vertical" onClick={() => onAlign('centerV')}>
                  <AlignIcon mode="centerV" />
                </ActionButton>
                <ActionButton title="Alinhar embaixo" onClick={() => onAlign('bottom')}>
                  <AlignIcon mode="bottom" />
                </ActionButton>
                {state.count > 2 && (
                  <>
                    <ActionButton title="Distribuir na horizontal" onClick={() => onDistribute('horizontal')}>
                      <DistributeIcon axis="horizontal" />
                    </ActionButton>
                    <ActionButton title="Distribuir na vertical" onClick={() => onDistribute('vertical')}>
                      <DistributeIcon axis="vertical" />
                    </ActionButton>
                  </>
                )}
              </div>
            </Section>
          )}

          <Section label="Ações">
            <div className="ecp-row">
              <ActionButton title="Duplicar (Ctrl+D)" onClick={onDuplicate}>
                <DuplicateIcon />
              </ActionButton>
              <ActionButton title="Excluir (Delete)" onClick={onDelete}>
                <TrashIcon />
              </ActionButton>
              {state.canGroup && (
                <ActionButton title="Agrupar (Ctrl+G)" onClick={onGroup}>
                  <GroupIcon />
                </ActionButton>
              )}
              {state.canUngroup && (
                <ActionButton title="Desagrupar (Ctrl+Shift+G)" onClick={onUngroup}>
                  <UngroupIcon />
                </ActionButton>
              )}
              <ActionButton title="Adicionar link (Ctrl+K)" onClick={onSetLink}>
                <LinkIcon />
              </ActionButton>
              <ActionButton title="Bloquear (Ctrl+Shift+L)" onClick={onLock}>
                <LockIcon />
              </ActionButton>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
