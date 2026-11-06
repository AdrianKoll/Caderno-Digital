import { useEffect } from 'react';

/**
 * Gestos da gaveta (menu lateral) no toque:
 *  - arrastar da borda esquerda da tela para a direita → abre;
 *  - arrastar a gaveta para a esquerda → fecha.
 * Só vale para movimentos claramente horizontais, para não atrapalhar o desenho.
 */
const EDGE = 16; // px da borda esquerda onde o gesto de abrir começa
const DISTANCE = 64; // deslocamento mínimo
const RATIO = 2; // |dx| precisa ser pelo menos 2x |dy|

export function useDrawerGestures(open: boolean, setOpen: (v: boolean) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let startX = 0;
    let startY = 0;
    let tracking: 'open' | 'close' | null = null;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = null;
      if (!open && startX <= EDGE) tracking = 'open';
      else if (open) tracking = 'close';
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) < DISTANCE || Math.abs(dx) < Math.abs(dy) * RATIO) return;
      if (tracking === 'open' && dx > 0) setOpen(true);
      if (tracking === 'close' && dx < 0) setOpen(false);
      tracking = null;
    };

    const onEnd = () => {
      tracking = null;
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [open, setOpen, enabled]);
}
