import { isNumbered } from './markers';
import { RichCustomData } from './types';

type El = any;

export const SHAPE_TYPES = ['rectangle', 'diamond', 'ellipse'];

/** Texto formatado ANTIGO: uma imagem (PNG) com o conteúdo em `customData.rich`. */
export function isRichImage(el: El): boolean {
  return !!el && el.type === 'image' && !!el.customData?.rich && !el.isDeleted;
}

/** "Caixa" de um texto formatado: retângulo invisível que guarda o conteúdo (`customData.rich`). */
export function isRichBox(el: El): boolean {
  return !!el && el.type === 'rectangle' && !!el.customData?.rich && !el.isDeleted;
}

/** Peça de um texto formatado: um trecho de texto, um marcador ou uma linha de sublinhado. */
export function isRichPart(el: El): boolean {
  return !!el && !el.isDeleted && el.customData?.richPart === true;
}

/** Quem guarda o conteúdo: a caixa (novo) ou a imagem (antigo). */
export function isRichHolder(el: El): boolean {
  return isRichBox(el) || isRichImage(el);
}

export function richData(el: El): RichCustomData | null {
  return isRichHolder(el) ? (el.customData as RichCustomData) : null;
}

/**
 * Peças que pertencem a esta caixa. O vínculo é o grupo mais interno (não um
 * id), para sobreviver a duplicar/colar.
 */
export function richPartsOf(box: El, elements: readonly El[]): El[] {
  const gid: string | undefined = box.groupIds?.[0];
  if (!gid) return [];
  return elements.filter((el) => isRichPart(el) && el.groupIds?.[0] === gid);
}

/** Caixa a que uma peça pertence. */
export function findBoxOfPart(part: El, elements: readonly El[]): El | null {
  const gid: string | undefined = part.groupIds?.[0];
  if (!gid) return null;
  return elements.find((el) => isRichBox(el) && el.groupIds?.[0] === gid) ?? null;
}

/** Forma que contém o texto formatado: a forma do mesmo grupo (o vínculo é o grupo, não um id, para sobreviver a duplicar/colar). */
export function findContainer(rich: El, elements: readonly El[]): El | null {
  const data = richData(rich);
  if (!data?.inShape) return null;
  const gid: string | undefined = rich.groupIds?.[0];
  if (!gid) return null;
  return (
    elements.find(
      (el) =>
        !el.isDeleted &&
        SHAPE_TYPES.includes(el.type) &&
        !isRichBox(el) &&
        !isRichPart(el) &&
        el.groupIds?.includes(gid),
    ) ?? null
  );
}

/** Texto formatado (caixa ou imagem antiga) que já mora dentro desta forma (se houver). */
export function findRichInShape(shape: El, elements: readonly El[]): El | null {
  const gids: string[] = shape.groupIds ?? [];
  if (gids.length === 0) return null;
  return (
    elements.find(
      (el) => isRichHolder(el) && el.customData?.inShape && gids.includes(el.groupIds?.[0]),
    ) ?? null
  );
}

export type EditTarget =
  | { kind: 'rich'; el: El }
  | { kind: 'shape'; el: El }
  | { kind: 'text'; el: El };

/**
 * O que "Editar texto" deve abrir para a seleção atual:
 *  - um texto formatado (qualquer peça dele, ou ele inteiro junto da forma que o contém);
 *  - uma forma (com ou sem texto nativo);
 *  - um texto nativo solto (é convertido em texto formatado).
 * `null` quando a seleção não tem texto para editar (linhas, setas...).
 *
 * Em `kind: 'rich'`, `el` é a caixa (ou a imagem, nos textos antigos).
 */
export function resolveEditTarget(elements: readonly El[], selectedIds: Set<string>): EditTarget | null {
  const sel = elements.filter((el) => !el.isDeleted && selectedIds.has(el.id));
  if (sel.length === 0) return null;

  if (sel.length === 1) {
    const el = sel[0];
    if (isRichHolder(el)) return { kind: 'rich', el };
    if (isRichPart(el)) {
      const box = findBoxOfPart(el, elements);
      if (box) return { kind: 'rich', el: box };
    }
    if (SHAPE_TYPES.includes(el.type)) {
      const sibling = findRichInShape(el, elements);
      return sibling ? { kind: 'rich', el: sibling } : { kind: 'shape', el };
    }
    if (el.type === 'text') {
      if (el.containerId) {
        const container = elements.find((e) => e.id === el.containerId && !e.isDeleted);
        if (container && SHAPE_TYPES.includes(container.type)) return { kind: 'shape', el: container };
        return null;
      }
      return { kind: 'text', el };
    }
    return null;
  }

  // Grupo de um texto formatado inteiro (caixa + peças, com ou sem a forma que o contém).
  const boxes = sel.filter(isRichBox);
  if (boxes.length === 1) {
    const box = boxes[0];
    const gid: string | undefined = box.groupIds?.[0];
    const container = findContainer(box, elements);
    const rest = sel.filter((el) => el !== box);
    if (gid && rest.every((el) => (isRichPart(el) && el.groupIds?.[0] === gid) || (container && el.id === container.id))) {
      return { kind: 'rich', el: box };
    }
  }

  // Só peças selecionadas (sem a caixa): ainda é o mesmo texto.
  if (sel.every(isRichPart)) {
    const gids = new Set(sel.map((el) => el.groupIds?.[0]));
    if (gids.size === 1) {
      const box = findBoxOfPart(sel[0], elements);
      if (box) return { kind: 'rich', el: box };
    }
  }

  // Texto antigo (imagem) agrupado com a forma: edita o texto.
  const inShape = sel.filter((el) => isRichImage(el) && el.customData?.inShape);
  if (inShape.length === 1 && findContainer(inShape[0], elements)) return { kind: 'rich', el: inShape[0] };
  return null;
}

// (reexport só para quem precisa saber se um tipo de marcador é numerado)
export { isNumbered };
