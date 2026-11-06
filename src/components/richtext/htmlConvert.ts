import { MarkerKind, MAX_INDENT, Para, RichDoc, Run } from './types';
import { markerLabels, MARKERS } from './markers';

/** Conversão entre o modelo (RichDoc) e o HTML do editor (contentEditable). */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const VALID_MARKERS = new Set<MarkerKind>(['none', ...MARKERS.map((marker) => marker.kind)]);
const SAFE_HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;

function safeColor(value: unknown): string | undefined {
  return typeof value === 'string' && SAFE_HEX_COLOR.test(value) ? value : undefined;
}

export function docToHtml(doc: RichDoc): string {
  return doc.paras
    .map((p) => {
      const inner = p.runs.length
        ? p.runs
            .map((r) => {
              const color = safeColor(r.color);
              const style = [
                color ? `color:${color}` : '',
                r.bold ? 'font-weight:700' : '',
                r.italic ? 'font-style:italic' : '',
                r.underline ? 'text-decoration:underline' : '',
              ]
                .filter(Boolean)
                .join(';');
              return style ? `<span style="${escAttr(style)}">${esc(String(r.text ?? ''))}</span>` : esc(String(r.text ?? ''));
            })
            .join('')
        : '<br>';
      const marker = VALID_MARKERS.has(p.marker) ? p.marker : 'none';
      const indent = Number.isInteger(p.indent) ? Math.min(MAX_INDENT, Math.max(0, p.indent)) : 0;
      return `<div data-m="${escAttr(marker)}" data-i="${indent}">${inner}</div>`;
    })
    .join('');
}

const INLINE = new Set(['#text', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'FONT', 'BR', 'A', 'S', 'STRIKE', 'SUB', 'SUP', 'CODE']);

/** Garante que todo conteúdo do editor está dentro de <div> (um por parágrafo). */
export function normalizeEditor(root: HTMLElement): boolean {
  let changed = false;
  if (root.childNodes.length === 0) {
    root.innerHTML = '<div data-m="none" data-i="0"><br></div>';
    return true;
  }
  let group: Node[] = [];
  const flush = (before: Node | null) => {
    if (!group.length) return;
    const div = document.createElement('div');
    div.dataset.m = 'none';
    div.dataset.i = '0';
    root.insertBefore(div, before);
    group.forEach((n) => div.appendChild(n));
    group = [];
    changed = true;
  };
  Array.from(root.childNodes).forEach((node) => {
    const isBlock = node.nodeType === 1 && (node as HTMLElement).tagName === 'DIV';
    if (!isBlock && (node.nodeName === '#text' || INLINE.has(node.nodeName))) group.push(node);
    else {
      flush(node);
      if (!isBlock) {
        node.parentNode?.removeChild(node);
        changed = true;
      }
    }
  });
  flush(null);
  return changed;
}

/** Atualiza o rótulo e o recuo de cada parágrafo (o CSS desenha o marcador com eles). */
export function refreshBlocks(root: HTMLElement): void {
  const blocks = Array.from(root.children) as HTMLElement[];
  const paras = blocks.map((b) => ({
    marker: (b.dataset.m as MarkerKind) || 'none',
    indent: Math.min(MAX_INDENT, Math.max(0, parseInt(b.dataset.i || '0', 10) || 0)),
  }));
  const labels = markerLabels(paras);
  blocks.forEach((b, i) => {
    if (!b.dataset.m) b.dataset.m = 'none';
    b.dataset.label = labels[i];
    b.style.setProperty('--i', String(paras[i].indent));
    b.style.setProperty('--mk', paras[i].marker === 'none' ? '0' : '1');
    // O marcador usa a cor do primeiro trecho do parágrafo (igual ao desenho final).
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first?.parentElement) b.style.setProperty('--mc', getComputedStyle(first.parentElement).color);
    else b.style.removeProperty('--mc');
  });
}

export function rgbToHex(rgb: string): string | undefined {
  const m = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
  if (!m) return rgb.startsWith('#') ? rgb.toLowerCase() : undefined;
  if (m[4] !== undefined && parseFloat(m[4]) === 0) return undefined;
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

function styleOf(node: Node, root: HTMLElement, defaultColor: string): Omit<Run, 'text'> {
  const el = (node.nodeType === 1 ? node : node.parentElement) as HTMLElement | null;
  if (!el) return {};
  const cs = getComputedStyle(el);
  let underline = false;
  for (let e: HTMLElement | null = el; e && e !== root.parentElement; e = e.parentElement) {
    if (getComputedStyle(e).textDecorationLine.includes('underline')) {
      underline = true;
      break;
    }
    if (e === root) break;
  }
  const weight = cs.fontWeight === 'bold' ? 700 : parseInt(cs.fontWeight, 10) || 400;
  const color = rgbToHex(cs.color);
  return {
    bold: weight >= 600 || undefined,
    italic: cs.fontStyle === 'italic' || cs.fontStyle === 'oblique' || undefined,
    underline: underline || undefined,
    color: color && color !== defaultColor.toLowerCase() ? color : undefined,
  };
}

/** Lê o editor e devolve os parágrafos (com estilos por trecho). */
export function htmlToParas(root: HTMLElement, defaultColor: string): Para[] {
  normalizeEditor(root);
  const paras: Para[] = [];

  for (const block of Array.from(root.children) as HTMLElement[]) {
    const runs: Run[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        const text = (node.nodeValue ?? '').replace(/\u00a0/g, ' ').replace(/[\r\n]+/g, ' ');
        if (!text) return;
        const style = styleOf(node, root, defaultColor);
        const last = runs[runs.length - 1];
        if (
          last &&
          !!last.bold === !!style.bold &&
          !!last.italic === !!style.italic &&
          !!last.underline === !!style.underline &&
          last.color === style.color
        ) {
          last.text += text;
        } else {
          runs.push({ text, ...stripUndefined(style) });
        }
        return;
      }
      node.childNodes.forEach(walk);
    };
    block.childNodes.forEach(walk);
    paras.push({
      runs,
      marker: (block.dataset.m as MarkerKind) || 'none',
      indent: Math.min(MAX_INDENT, Math.max(0, parseInt(block.dataset.i || '0', 10) || 0)),
    });
  }
  return paras.length ? paras : [{ runs: [], marker: 'none', indent: 0 }];
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}
