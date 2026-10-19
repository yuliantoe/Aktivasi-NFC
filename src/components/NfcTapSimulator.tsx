import React, { useEffect, useState } from 'react';
import { CardData } from '../types';
import { sound } from '../utils/audio';
import { Smartphone, Wifi, CheckCircle2, Radio, Cpu } from 'lucide-react';

interface NfcTapSimulatorProps {
  card: CardData;
  onTapped: () => void;
  onClose: () => void;
}

export const NfcTapSimulator: React.FC<NfcTapSimulatorProps> = ({ card, onTapped, onClose }) => {
  const [phase, setPhase] = useState<'approaching' | 'contact' | 'success'>('approaching');

  useEffect(() => {
    // 1. Approaching phone
    const t1 = setTimeout(() => {
      setPhase('contact');
      sound.playNfcTap();
    }, 700);

    // 2. Success state
    const t2 = setTimeout(() => {
      setPhase('success');
    }, 1200);

    // 3. Complete and launch review screen
    const t3 = setTimeout(() => {
      onTapped();
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onTapped]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-slate-100 flex flex-col items-center overflow-hidden">
        {/* Frequency & Standard Badge */}
        <div className="mb-3 px-3 py-1 rounded-full bg-slate-900 text-cyan-300 font-mono text-[11px] font-bold border border-slate-700 flex items-center gap-1.5 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Frekuensi: 13.56 MHz (ISO 14443-A)</span>
        </div>

        {/* Background ambient glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-64 h-72 flex items-center justify-center">
          {/* NFC Contactless Ripple Rings when in contact */}
          {(phase === 'contact' || phase === 'success') && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="absolute w-24 h-24 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
              <span className="absolute w-36 h-36 rounded-full border border-blue-400 animate-ping opacity-50" style={{ animationDelay: '150ms' }} />
              <span className="absolute w-48 h-48 rounded-full border border-blue-300 animate-ping opacity-25" style={{ animationDelay: '300ms' }} />
            </div>
          )}

          {/* Miniature Smart NFC Card 13.56 MHz */}
          <div className="w-52 aspect-[1.586/1] rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-white p-3 flex flex-col justify-between z-10 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Wifi className="w-4 h-4 text-cyan-400 rotate-90" />
                <span className="text-[8.5px] font-mono text-cyan-300">13.56 MHz</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-300">#{card.id}</span>
            </div>
            <div className="w-7 h-4 rounded bg-amber-400/90" />
            <div>
              <p className="text-[10px] font-bold truncate text-white">{card.name}</p>
              <p className="text-[8px] font-mono text-slate-400 truncate">
                UID: {card.nfcUid || '04:A8:1F:B3:2E:77'}
              </p>
            </div>
          </div>

          {/* Animated Smartphone moving in to tap card */}
          <div
            className={`absolute z-20 w-36 h-60 rounded-[28px] bg-slate-900 border-4 border-slate-700 shadow-2xl p-2 flex flex-col items-center justify-between transition-all duration-500 ease-out ${
              phase === 'approaching'
                ? '-translate-y-20 -rotate-12 opacity-80 scale-90'
                : phase === 'contact'
                ? '-translate-y-4 rotate-0 scale-100'
                : '-translate-y-2 scale-102'
            }`}
          >
            {/* Phone Speaker Notch */}
            <div className="w-10 h-1.5 rounded-full bg-slate-700" />

            {/* Screen Content */}
            <div className="w-full flex-1 bg-slate-950 rounded-[18px] p-2 flex flex-col items-center justify-center text-center overflow-hidden">
              {phase === 'success' ? (
                <div className="flex flex-col items-center animate-scale-up">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                  <span className="text-[9px] font-bold text-emerald-300">NFC 13.56 MHz!</span>
                  <span className="text-[7.5px] text-slate-400 mt-0.5">Membuka Google Review...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Smartphone className="w-6 h-6 text-cyan-400 animate-pulse mb-1" />
                  <span className="text-[8.5px] text-slate-300 font-medium">NFC Terdeteksi</span>
                </div>
              )}
            </div>

            {/* Home indicator bar */}
            <div className="w-12 h-1 rounded-full bg-slate-600 mt-1" />
          </div>
        </div>

        {/* Text descriptions */}
        <h3 className="text-lg font-bold text-slate-900 mt-2 font-display">
          {phase === 'approaching' && 'Mendekatkan Smartphone ke Kartu...'}
          {phase === 'contact' && 'NFC 13.56 MHz Terbaca! (Beep)'}
          {phase === 'success' && 'Mengalihkan ke Halaman Ulasan'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[270px] leading-relaxed">
          Simulasi nyata saat pelanggan menempelkan smartphone pada kartu ulasan NFC 13.56 MHz di meja kasir.
        </p>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Tutup Simulasi
        </button>
      </div>
    </div>
  );
};
