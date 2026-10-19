import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, KeyRound } from 'lucide-react';

interface PinModalProps {
  expectedPin: string;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  expectedPin,
  title = 'Masukkan PIN Kartu',
  subtitle = 'Masukkan PIN 4 digit untuk membuka pengaturan kartu.',
  onSuccess,
  onClose,
}) => {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string>('');
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = clean;
    setPinDigits(newDigits);
    setError('');

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (clean && index === 3) {
      const entered = newDigits.join('');
      if (entered === expectedPin) {
        onSuccess();
      } else {
        setError('PIN salah. Silakan coba lagi.');
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);
    const focusIdx = Math.min(pasted.length, 3);
    inputRefs[focusIdx].current?.focus();

    if (pasted.length === 4) {
      if (pasted === expectedPin) {
        onSuccess();
      } else {
        setError('PIN salah. Silakan coba lagi.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = pinDigits.join('');
    if (entered === expectedPin) {
      onSuccess();
    } else {
      setError('PIN salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 font-display text-center">
          {title}
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6">
          <div className="flex justify-center gap-2">
            {pinDigits.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className="w-10 h-11 text-center text-lg font-bold font-mono rounded-lg border-2 border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-slate-50 text-slate-900 transition-all"
                aria-label={`Digit PIN ke-${i + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-rose-600 text-center mt-3 font-medium flex items-center justify-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-6 py-3.5 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
          >
            Verifikasi PIN
          </button>
        </form>
      </div>
    </div>
  );
};
