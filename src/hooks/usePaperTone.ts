import { useCallback, useSyncExternalStore } from 'react';

export type PaperTone = 'light' | 'dark';

const STORAGE_KEY = 'caderno-paper-tone';
const listeners = new Set<() => void>();

function getSnapshot(): PaperTone {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPaperTone(tone: PaperTone): void {
  try {
    localStorage.setItem(STORAGE_KEY, tone);
  } catch {
    // Sem armazenamento disponível, a preferência vale durante a sessão atual.
  }
  listeners.forEach((listener) => listener());
}

/** Preferência global da cor do papel, independente do tema da interface. */
export function usePaperTone(): { tone: PaperTone; setTone: (tone: PaperTone) => void } {
  const tone = useSyncExternalStore(subscribe, getSnapshot, (): PaperTone => 'light');
  const updateTone = useCallback((next: PaperTone) => setPaperTone(next), []);
  return { tone, setTone: updateTone };
}
