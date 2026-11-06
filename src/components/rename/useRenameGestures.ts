import { PointerEvent, MouseEvent, useRef } from 'react';
import { RenameTarget, useNotebookStore } from '../../store/notebookStore';

const HOLD_MS = 550;
const MOVE_TOLERANCE = 8; // px: mexer o dedo além disso é rolagem, não segurar

/**
 * Gestos para renomear direto de um botão (abas, cartões…):
 *   - duplo clique (mouse);
 *   - botão direito;
 *   - segurar o dedo (toque) — o toque seguinte NÃO navega.
 * Espalhe o resultado no elemento: `<button {...gestures}>`.
 */
export function useRenameGestures(target: RenameTarget) {
  const openRename = useNotebookStore((s) => s.openRename);
  const timer = useRef<number | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const held = useRef(false);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return {
    onDoubleClick: (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      openRename(target);
    },
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      clear();
      openRename(target);
    },
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      held.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        held.current = true;
        navigator.vibrate?.(12);
        openRename(target);
      }, HOLD_MS);
    },
    onPointerMove: (e: PointerEvent) => {
      if (timer.current === null) return;
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    // Depois de segurar, o "clique" que o navegador gera ao soltar não deve abrir a página.
    onClickCapture: (e: MouseEvent) => {
      if (held.current) {
        held.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
