import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CardData } from '../types';
import { getGoogleReviewUrl, formatWhatsAppDisplay } from '../data/presets';
import { sound } from '../utils/audio';
import { Star, MessageCircle, ExternalLink, ArrowLeft, RotateCcw, Send, HeartHandshake, Sparkles } from 'lucide-react';

interface CustomerRatingProps {
  card: CardData;
  onBackToDashboard: () => void;
  onRecordReview: (rating: number) => void;
}

type RatingScreen = 'picker' | 'google' | 'complaint' | 'wa_preview';

export const CustomerRating: React.FC<CustomerRatingProps> = ({
  card,
  onBackToDashboard,
  onRecordReview,
}) => {
  const [screen, setScreen] = useState<RatingScreen>('picker');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [formattedWaText, setFormattedWaText] = useState<string>('');

  const reviewUrl = getGoogleReviewUrl(card.placeId, card.customUrl);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    sound.playStarPing(rating);
    onRecordReview(rating);

    setTimeout(() => {
      if (rating >= 4) {
        sound.playSuccess();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#3b82f6', '#10b981', '#6366f1'],
          });
        } catch {
          // ignore
        }
        setScreen('google');
      } else {
        setScreen('complaint');
      }
    }, 280);
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = customerName.trim();
    const cleanMsg = feedbackMsg.trim();

    let text = `Halo ${card.name}, saya baru saja berkunjung dan memberi rating ${selectedRating}/5 bintang.`;
    if (cleanName) {
      text += `\nNama: ${cleanName}`;
    }
    if (cleanMsg) {
      text += `\n\nMasukan & Keluhan:\n"${cleanMsg}"`;
    } else {
      text += `\n\n(Mohon tingkatkan pelayanan/kualitas agar lebih baik lagi).`;
    }

    setFormattedWaText(text);
    setScreen('wa_preview');
  };

  const waLink = `https://wa.me/${card.wa}?text=${encodeURIComponent(formattedWaText)}`;

  // 1. STAR RATING PICKER SCREEN
  if (screen === 'picker') {
    return (
      <div className="text-center">
        <p className="text-sm text-slate-500 font-medium">
          Terima kasih sudah berkunjung ke
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">
          {card.name}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Bagaimana pengalaman Anda hari ini?
        </p>

        {/* 5-Star Rating Buttons */}
        <div className="flex justify-center items-center gap-1.5 sm:gap-2 my-7" role="radiogroup" aria-label="Beri rating bintang">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || selectedRating) >= star;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleStarClick(star)}
                className="p-1.5 sm:p-2 rounded-xl transition-transform active:scale-125 focus:outline-none cursor-pointer"
                aria-label={`${star} bintang`}
              >
                <svg
                  className={`w-11 h-11 sm:w-12 sm:h-12 transition-all duration-150 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400 drop-shadow-sm scale-105'
                      : 'fill-slate-200 text-slate-200 hover:fill-amber-200 hover:text-amber-200'
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
                </svg>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Ketuk bintang untuk memberi nilai kepuasan
        </p>

        {/* Back Link */}
        <div className="mt-8 pt-4 border-t border-slate-100">
          <button
            onClick={onBackToDashboard}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
          >
            Kembali ke pengaturan kartu
          </button>
        </div>
      </div>
    );
  }

  // 2. GOOGLE REVIEW REDIRECT SCREEN (4 & 5 STARS)
  if (screen === 'google') {
    return (
      <div className="text-center">
        {/* Rating Tag */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {selectedRating} Bintang
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
          Langsung ke Google Review
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Rating 4 dan 5 tidak melewati form. Pelanggan langsung diarahkan ke halaman ulasan bisnis di Google Maps untuk mendongkrak reputasi publik Anda!
        </p>

        {/* Simulated Browser URL Box */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Halaman yang Terbuka
          </span>
          <p className="text-xs font-mono text-slate-700 break-all leading-relaxed">
            {reviewUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Google Review Asli</span>
          </a>

          <button
            onClick={() => {
              setSelectedRating(0);
              setScreen('picker');
            }}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Coba Rating Lain</span>
          </button>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100">
          <button
            onClick={onBackToDashboard}
            className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
          >
            Kembali ke dasbor kartu
          </button>
        </div>
      </div>
    );
  }

  // 3. LOW RATING / COMPLAINT FORM (1, 2, 3 STARS)
  if (screen === 'complaint') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            {selectedRating} Bintang
          </span>
          <span className="text-xs text-slate-500">Filter Ulasan Privat</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
          Mohon maaf atas ketidaknyamanan
        </h1>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          Ceritakan apa yang kurang berkesan. Pesan Anda langsung diterima pemilik secara pribadi lewat WhatsApp, melindungi nilai Google Review Anda dari ulasan buruk.
        </p>

        <form onSubmit={handleComplaintSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="c-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Anda (Opsional)
            </label>
            <input
              id="c-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              autoComplete="name"
              className="w-full px-3.5 py-3 bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="c-msg" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keluhan atau Masukan
            </label>
            <textarea
              id="c-msg"
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              placeholder="Ceritakan apa yang perlu kami perbaiki (makanan, kebersihan, pelayanan, waktu tunggu...)"
              rows={4}
              required
              className="w-full px-3.5 py-3 bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all placeholder:text-slate-400 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Pesan ini hanya dikirim ke WhatsApp pemilik, tidak akan tampil di publik.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim via WhatsApp Pemilik</span>
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              setSelectedRating(0);
              setScreen('picker');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
          >
            Ubah rating bintang
          </button>
        </div>
      </div>
    );
  }

  // 4. WHATSAPP OPEN / PREVIEW SCREEN
  return (
    <div className="text-center">
      <div className="mb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
          Masuk ke WhatsApp Pemilik
        </span>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
        Keluhan Terfilter Aman
      </h1>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
        WhatsApp terbuka dengan pesan keluhan yang sudah terisi otomatis, langsung ke nomor pemilik{' '}
        <span className="font-semibold text-slate-800 font-mono">
          {formatWhatsAppDisplay(card.wa)}
        </span>
        .
      </p>

      {/* WhatsApp Message Preview Bubble */}
      <div className="mt-5 p-4 rounded-2xl bg-[#e7f6ee] border border-emerald-200/80 text-left relative">
        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
          <MessageCircle className="w-3 h-3 text-emerald-700" />
          <span>Isi Pesan WhatsApp Otomatis</span>
        </div>
        <p className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
          {formattedWaText}
        </p>
      </div>

      {/* Open WhatsApp Button */}
      <div className="mt-6 space-y-2.5">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 bg-[#25d366] hover:bg-[#20ba59] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Buka WhatsApp Sekarang</span>
        </a>

        <button
          onClick={() => {
            setSelectedRating(0);
            setScreen('picker');
          }}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Coba Simulasi Lagi</span>
        </button>
      </div>

      <div className="mt-6 pt-3 border-t border-slate-100">
        <button
          onClick={onBackToDashboard}
          className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
        >
          Kembali ke dasbor kartu
        </button>
      </div>
    </div>
  );
};
