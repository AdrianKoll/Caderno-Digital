/**
 * Cor das divisórias do fichário. Cada matéria ganha uma cor da paleta de
 * forma estável (a partir do id), sem precisar de campo novo no banco.
 */
const PALETTE = [
  '#2f6f4f', // verde-floresta
  '#4f9a62', // verde
  '#8fb339', // verde-limão
  '#e0c340', // amarelo
  '#d98c3a', // laranja
  '#8a5a3a', // marrom
  '#3f7f9f', // azul-petróleo
  '#6b5b9a', // roxo
  '#b5553c', // terracota
  '#4a5f9f', // azul
];

export function subjectColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Texto claro ou escuro, o que ler melhor sobre a cor da divisória. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.62 ? '#1f2a1c' : '#ffffff';
}
