import { generateId } from './id';

/**
 * Migração do modo "Escrever" (removido) para elemento nativo do Excalidraw.
 *
 * O campo `page.content` guardava HTML de um `contentEditable` (ver
 * WritingArea, removido). Ele NUNCA é apagado por esta função — apenas lido
 * uma vez para gerar um elemento de texto real dentro da cena do Excalidraw,
 * e a página é marcada com `contentMigrated: true` para não duplicar o texto
 * em execuções futuras. Se a extração falhar por qualquer motivo, a função
 * devolve string vazia e a cena não é alterada — o `content` original
 * continua intacto no banco para investigação manual.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  try {
    // Preserva quebras de linha de blocos/parágrafos/listas antes de
    // remover as tags, para não colar tudo em uma única linha.
    const withBreaks = html
      .replace(/<\/(p|div|h1|h2|h3|h4|li|pre|br)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n');
    const withoutTags = withBreaks.replace(/<[^>]+>/g, '');
    const withoutEntities = withoutTags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return withoutEntities
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return '';
  }
}

/**
 * Cria um elemento de texto do Excalidraw a partir de texto simples,
 * posicionado no canto superior esquerdo da folha para não sobrepor
 * desenhos existentes. Usa os mesmos campos que o Excalidraw grava ao criar
 * um texto pela própria ferramenta "Texto", para que o elemento seja 100%
 * nativo (editável, movível, com as mesmas propriedades de qualquer outro
 * texto criado na ferramenta).
 */
export function createLegacyTextElement(text: string, x = 40, y = 40, fontFamily = 2) {
  const lines = text.split('\n');
  const fontSize = 20;
  const lineHeight = 1.25;
  // Array.from conta caracteres reais (símbolos como 𝛼 ocupam 2 posições em `.length`).
  const longestLine = Math.max(...lines.map((l) => Array.from(l).length), 1);

  return {
    id: generateId(),
    type: 'text',
    x,
    y,
    width: Math.max(longestLine * fontSize * 0.6, 40),
    height: lines.length * fontSize * lineHeight,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
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
    text,
    fontSize,
    fontFamily,
    textAlign: 'left',
    verticalAlign: 'top',
    baseline: fontSize,
    containerId: null,
    originalText: text,
    lineHeight,
  };
}
