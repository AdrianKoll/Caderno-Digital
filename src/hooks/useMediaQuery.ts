import { useEffect, useState } from 'react';

/** Acompanha uma media query (ex.: `useMediaQuery('(max-width: 900px)')`). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Celular / tablet em pé: mesmo corte (900px) usado em todo o CSS. */
export const MOBILE_QUERY = '(max-width: 900px)';

/** Abaixo disto a barra de ferramentas do desenho vira doca no pé da tela (DrawToolbar.css). */
export const DOCK_QUERY = '(max-width: 1179px)';
