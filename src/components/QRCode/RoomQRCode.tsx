import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabase';

interface RoomQRCodeProps {
  code: string;
  url?: string;
}

export const RoomQRCode: React.FC<RoomQRCodeProps> = ({ code, url }) => {
  const [copied, setCopied] = React.useState(false);
  const roomUrl = url || `${window.location.origin}/r/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      prompt('Copia este enlace para invitar a tus amigos:', roomUrl);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mesa de Truco ${code} en MAZO`,
          text: `Unite a la mesa con el código ${code} para jugar al Truco:`,
          url: roomUrl,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex flex-col items-center bg-stone-900/80 border border-emerald-800/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md max-w-sm w-full mx-auto">
      <div className="text-center mb-4">
        <span className="text-xs uppercase font-mono tracking-widest text-amber-300/80">
          CÓDIGO DE MESA
        </span>
        <h2 className="text-4xl font-black tracking-widest text-white mt-0.5 font-mono drop-shadow-md">
          {code}
        </h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-inner border-4 border-amber-300/20">
        <QRCodeSVG
          value={roomUrl}
          size={180}
          level="H"
          bgColor="#ffffff"
          fgColor="#0c2317"
          includeMargin={false}
        />
      </div>

      <p className="text-xs text-stone-400 mt-4 text-center">
        {isSupabaseConfigured ? 'Escaneá con la cámara de tu celular para unirte.' : 'Demo local: este enlace solo funciona en el mismo navegador.'}
      </p>

      <div className="flex gap-2 w-full mt-4">
        <button
          onClick={handleCopy}
          className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-stone-700"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar link</span>
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-600/40"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
};
