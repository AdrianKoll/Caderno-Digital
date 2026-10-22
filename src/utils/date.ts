export function todayLabel(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
}

/**
 * Lê a data de uma página. O campo é texto livre (o usuário edita no cabeçalho),
 * então aceitamos "04 / 10 / 2026", "04/10/2026", "4-10-26", "04.10.2026"…
 * Devolve o timestamp (meia-noite local) ou `null` se não der para entender.
 */
export function parsePageDate(label: string): number | null {
  const m = /^\s*(\d{1,2})\s*[/.\-]\s*(\d{1,2})\s*[/.\-]\s*(\d{2}|\d{4})\s*$/.exec(label ?? '');
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (m[3].length === 2) year += 2000;
  const d = new Date(year, month - 1, day);
  // Rejeita datas impossíveis (31/02 viraria março).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d.getTime();
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Valor para <input type="date"> (aaaa-mm-dd), no fuso local. */
export function toDateInputValue(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Lê o valor de um <input type="date"> (aaaa-mm-dd) como meia-noite local; `null` se vazio/inválido. */
export function fromDateInputValue(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}
