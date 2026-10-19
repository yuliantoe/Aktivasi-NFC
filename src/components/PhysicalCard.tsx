import React, { useState } from 'react';
import { CardData } from '../types';
import { Wifi, Sparkles, RotateCw, ExternalLink } from 'lucide-react';

interface PhysicalCardProps {
  card: CardData | null;
  onTap?: () => void;
  interactive?: boolean;
}

export const PhysicalCard: React.FC<PhysicalCardProps> = ({ card, onTap, interactive = true }) => {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const theme = card?.colorTheme || 'midnight';

  const themeStyles = {
    midnight: {
      cardBg: 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-stone-900 text-white border-neutral-700/60 shadow-2xl shadow-neutral-950/40',
      accent: 'text-amber-400',
      badgeBg: 'bg-white/10 text-white border-white/10',
      chipColor: 'from-amber-200 via-yellow-400 to-amber-600',
      watermark: 'text-white/5',
    },
    white: {
      cardBg: 'bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 border-slate-200/90 shadow-2xl shadow-slate-300/50',
      accent: 'text-blue-600',
      badgeBg: 'bg-slate-900 text-white border-slate-900',
      chipColor: 'from-amber-300 via-yellow-400 to-amber-600',
      watermark: 'text-slate-900/5',
    },
    navy: {
      cardBg: 'bg-gradient-to-br from-[#0c1e47] via-[#102a6b] to-[#071330] text-white border-blue-500/30 shadow-2xl shadow-blue-950/50',
      accent: 'text-amber-400',
      badgeBg: 'bg-white/15 text-white border-white/20',
      chipColor: 'from-amber-200 via-yellow-400 to-amber-600',
      watermark: 'text-white/5',
    },
    emerald: {
      cardBg: 'bg-gradient-to-br from-[#063323] via-[#094732] to-[#032015] text-white border-emerald-500/30 shadow-2xl shadow-emerald-950/50',
      accent: 'text-emerald-300',
      badgeBg: 'bg-white/15 text-white border-white/20',
      chipColor: 'from-amber-200 via-yellow-400 to-amber-600',
      watermark: 'text-white/5',
    },
  }[theme];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="relative group perspective-1000 select-none">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => onTap && onTap()}
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className={`relative w-full aspect-[1.586/1] rounded-2xl p-5 border flex flex-col justify-between overflow-hidden cursor-pointer transition-shadow duration-300 ${themeStyles.cardBg}`}
      >
        {/* Subtle holographic sheen overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {/* Contactless / NFC Wave Symbol */}
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center">
              <Wifi className="w-5 h-5 rotate-90 opacity-90" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold opacity-75 leading-none">
                Smart NFC Review
              </div>
              <div className="text-xs font-mono font-bold tracking-tight mt-0.5">
                #{card?.id || 'A7K2'}
              </div>
            </div>
          </div>

          {/* Google G Logo Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-slate-800 shadow-sm border border-slate-100">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-[11px] font-bold tracking-tight">Review</span>
          </div>
        </div>

        {/* Center EMV Smart Chip */}
        <div className="relative z-10 flex items-center justify-between my-auto pt-1">
          {/* Gold metallic smart chip replica */}
          <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600 border border-amber-300/80 shadow-inner flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />
            <div className="w-full h-[1px] bg-amber-700/60" />
            <div className="h-full w-[1px] bg-amber-700/60 absolute" />
            <div className="w-4 h-4 rounded-full border border-amber-700/60 absolute" />
          </div>

          {/* 5 Golden Stars display */}
          <div className="flex items-center gap-1 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
              </svg>
            ))}
          </div>
        </div>

        {/* Bottom Business Info */}
        <div className="relative z-10">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight truncate leading-snug">
                {card?.name || 'Bisnis Anda'}
              </h2>
              <p className="text-[11px] opacity-75 truncate mt-0.5">
                {card?.addr || 'Ketuk smartphone pelanggan untuk ulasan instan'}
              </p>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-medium opacity-80">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              NFC Chip Aktif
            </span>
            <span className="tracking-wider uppercase">Tap or Scan</span>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none">
          <Wifi className="w-56 h-56 rotate-90" />
        </div>
      </div>

      {interactive && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>Klik atau ketuk kartu untuk simulasi tap NFC</span>
        </div>
      )}
    </div>
  );
};
