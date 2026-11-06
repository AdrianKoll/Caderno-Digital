import { generateId } from '../../utils/id';
import { RichCustomData } from './types';

type El = any;

export function newFileId(): string {
  return `rich-${generateId()}`;
}

/**
 * Elemento `image` do Excalidraw para um texto formatado. Montado à mão (com
 * todos os campos que o Excalidraw grava) para não depender de detalhes da
 * função de conversão da biblioteca — mesma abordagem de createLegacyTextElement.
 */
export function makeRichImageElement(opts: {
  x: number;
  y: number;
  width: number;
  height: number;
  fileId: string;
  customData: RichCustomData;
  groupIds?: string[];
}): El {
  return {
    id: generateId(),
    type: 'image',
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: opts.groupIds ?? [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    status: 'saved',
    fileId: opts.fileId,
    scale: [1, 1],
    crop: null,
    customData: opts.customData,
  };
}

export function bump(el: El, patch: Record<string, unknown>): El {
  return {
    ...el,
    ...patch,
    version: (el.version ?? 1) + 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: Date.now(),
  };
}

/** Marca os elementos como apagados e tira as referências a eles das formas que os continham. */
export function deleteElements(elements: readonly El[], ids: Set<string>): El[] {
  return elements.map((el) => {
    if (ids.has(el.id)) return bump(el, { isDeleted: true });
    if (el.boundElements?.some((b: any) => ids.has(b.id))) {
      return bump(el, { boundElements: el.boundElements.filter((b: any) => !ids.has(b.id)) });
    }
    return el;
  });
}
