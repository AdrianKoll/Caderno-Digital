import { Page } from '../types';

/**
 * O que a página tem dentro, para o filtro "Conteúdo". Vem dos elementos do
 * Excalidraw guardados em `excalidrawData`:
 *   texto   — texto solto ou texto formatado (peças `richPart`)
 *   desenho — traço à mão, linha ou seta
 *   formas  — retângulo, losango, elipse
 *   imagem  — imagem colada/inserida (a imagem de um trecho em itálico não conta)
 *   vazia   — nenhum elemento (e sem texto no conteúdo antigo)
 */
export type PageKind = 'text' | 'drawing' | 'shapes' | 'image' | 'empty';

export const PAGE_KIND_LABEL: Record<PageKind, string> = {
  text: 'Texto',
  drawing: 'Desenho',
  shapes: 'Formas',
  image: 'Imagem',
  empty: 'Vazia',
};

const cache = new Map<string, { stamp: number; kinds: Set<PageKind> }>();

export function getPageKinds(page: Page): Set<PageKind> {
  const hit = cache.get(page.id);
  if (hit && hit.stamp === page.updatedAt) return hit.kinds;

  const kinds = new Set<PageKind>();
  try {
    const parsed = page.excalidrawData ? JSON.parse(page.excalidrawData) : null;
    const elements: any[] = Array.isArray(parsed?.elements) ? parsed.elements : [];
    for (const el of elements) {
      if (!el || el.isDeleted) continue;
      const richPart = el.customData?.richPart === true;
      switch (el.type) {
        case 'text':
          kinds.add('text');
          break;
        case 'freedraw':
        case 'line':
        case 'arrow':
          if (!richPart) kinds.add('drawing');
          break;
        case 'rectangle':
        case 'diamond':
        case 'ellipse':
          // A caixa invisível e o sublinhado do texto formatado são peças de texto, não formas.
          if (richPart || el.customData?.rich) kinds.add('text');
          else kinds.add('shapes');
          break;
        case 'image':
          if (richPart) kinds.add('text');
          else if (el.customData?.rich) kinds.add('text');
          else kinds.add('image');
          break;
      }
    }
  } catch {
    // JSON inválido: tratada como sem conteúdo reconhecível.
  }
  // Conteúdo do antigo modo "Escrever" (HTML) também é texto.
  if (page.content && page.content.replace(/<[^>]+>/g, '').trim()) kinds.add('text');
  if (kinds.size === 0) kinds.add('empty');

  cache.set(page.id, { stamp: page.updatedAt, kinds });
  return kinds;
}
