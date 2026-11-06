import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'caderno-theme';
const META_COLOR: Record<Theme, string> = { dark: '#080F10', light: '#F5F7F2' };

/** Tema guardado no aparelho (escuro é o padrão). */
export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Aplica o tema na página: o CSS reage ao atributo data-theme do <html> (ver styles/theme.css, seções 1 e 15). */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
}

/** Claro / escuro, com o botão da lua da barra superior (celular). */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* sem armazenamento: o tema vale só até recarregar */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}
