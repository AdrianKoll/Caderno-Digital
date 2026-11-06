import { useCallback, useEffect, useRef, useState } from 'react';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export function useAutosave<T>(value: T, onSave: (value: T) => Promise<void>, delay = 600, identity?: string) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ value: T; save: (value: T) => Promise<void> } | null>(null);
  const isFirstRun = useRef(true);
  const lastIdentity = useRef(identity);
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    if (lastIdentity.current !== identity) {
      lastIdentity.current = identity;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const previous = pending.current;
      pending.current = null;
      if (previous) void previous.save(previous.value).catch((error) => console.error('Falha ao descarregar autosave local:', error));
      setStatus('idle');
      return; // o valor atual pode pertencer à página anterior; aguarda a sincronização do novo registro
    }
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    const job = { value, save: onSave };
    pending.current = job;
    timer.current = setTimeout(async () => {
      timer.current = null;
      if (pending.current === job) pending.current = null;
      try { await job.save(job.value); setStatus('saved'); }
      catch (error) { console.error('Falha ao salvar alteração local:', error); setStatus('error'); }
    }, delay);
    return () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, retryCount, identity]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const last = pending.current;
    pending.current = null;
    if (last) void last.save(last.value).catch((error) => console.error('Falha ao descarregar autosave local:', error));
  }, []);

  const retry = useCallback(() => setRetryCount((n) => n + 1), []);
  return { status, retry };
}
