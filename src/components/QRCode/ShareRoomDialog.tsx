import { useEffect, useRef } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { RoomQRCode } from './RoomQRCode';

export function ShareRoomDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const historyKey = useRef(`qr-${crypto.randomUUID()}`);
  const closing = useRef(false);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    if (window.history.state?.mazoShareDialog !== historyKey.current) {
      window.history.pushState({ ...window.history.state, mazoShareDialog: historyKey.current }, '', window.location.href);
    }
    const handleBack = () => {
      if (window.history.state?.mazoShareDialog !== historyKey.current) closeCallback.current();
    };
    window.addEventListener('popstate', handleBack);
    dialog.current?.showModal();
    return () => {
      window.removeEventListener('popstate', handleBack);
      dialog.current?.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (window.history.state?.mazoShareDialog === historyKey.current) window.history.back();
    else closeCallback.current();
  };

  return <dialog ref={dialog} aria-labelledby="share-room-title"
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target === event.currentTarget) close(); }}
    className="qr-panel w-[calc(100%_-_2rem)] max-w-sm max-h-[90dvh] m-auto p-0 rounded-3xl border border-emerald-800 bg-stone-900 text-white backdrop:bg-black/80 backdrop:backdrop-blur-sm">
    <header className="flex items-center justify-between gap-3 px-4 pt-3">
      <h2 id="share-room-title" className="text-sm font-semibold text-amber-100">Compartir mesa</h2>
      <button type="button" autoFocus aria-label="Cerrar invitación" onClick={close}
        className="min-w-11 rounded-xl flex items-center justify-center text-stone-300 hover:bg-stone-800"><X className="w-5 h-5" /></button>
    </header>
    <RoomQRCode code={code} />
    <div className="px-6 pb-5">
      <button type="button" onClick={close} className="w-full rounded-xl border border-stone-600 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-stone-800">
        <ArrowLeft className="w-4 h-4" />Volver a la mesa
      </button>
    </div>
  </dialog>;
}
