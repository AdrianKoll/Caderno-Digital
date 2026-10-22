import { useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved';

/**
 * Debounce genérico para autosave. Chama `onSave(value)` `delay`ms depois da
 * última mudança e expõe um status ("Salvando..." / "Salvo") para a UI.
 */
export function useAutosave<T>(value: T, onSave: (value: T) => Promise<void>, delay = 600) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await onSave(value);
      setStatus('saved');
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return status;
}
