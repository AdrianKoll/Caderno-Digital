/** Regras de nome para matérias, tópicos e títulos de página. */
export const NAME_MAX = 80;
export const TITLE_MAX = 120;

/** Tira espaços das pontas e junta espaços repetidos. */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

/** Compara nomes sem diferenciar maiúsculas/acentos ("Matemática" = "matematica"). */
export function sameName(a: string, b: string): boolean {
  const fold = (s: string) => normalizeName(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return fold(a) === fold(b);
}
