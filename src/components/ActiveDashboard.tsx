import React, { useState } from 'react';
import { CardData, ReviewStats } from '../types';
import { getGoogleReviewUrl, formatWhatsAppDisplay, buildGoogleMapsSearchUrl, buildNfcSmartReviewUrl } from '../data/presets';
import {
  Check,
  Copy,
  ExternalLink,
  Play,
  Settings,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Star,
  MessageSquare,
  Radio,
  MapPin,
  Cpu,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ActiveDashboardProps {
  card: CardData;
  stats: ReviewStats;
  onTryCustomer: () => void;
  onSimulateNfc: () => void;
  onOpenNfcConnection: () => void;
  onOpenSettings: () => void;
  onResetCard: () => void;
}

export const ActiveDashboard: React.FC<ActiveDashboardProps> = ({
  card,
  stats,
  onTryCustomer,
  onSimulateNfc,
  onOpenNfcConnection,
  onOpenSettings,
  onResetCard,
}) => {
  const [copiedReviewUrl, setCopiedReviewUrl] = useState(false);
  const reviewUrl = getGoogleReviewUrl(card.placeId, card.customUrl, card.name, card.addr);
  const mapsSearchUrl = card.googleMapsUrl || buildGoogleMapsSearchUrl(card.name, card.addr);
  const smartReviewUrl = buildNfcSmartReviewUrl(card);

  const handleCopyReviewUrl = () => {
    navigator.clipboard.writeText(smartReviewUrl);
    setCopiedReviewUrl(true);
    sound.playStarPing(3);
    setTimeout(() => setCopiedReviewUrl(false), 2000);
  };

  return (
    <div>
      {/* Steps progress bar */}
      <div className="flex gap-1.5 mb-4">
        <span className="flex-1 h-1.5 rounded-full bg-blue-600" />
        <span className="flex-1 h-1.5 rounded-full bg-blue-600" />
        <span className="flex-1 h-1.5 rounded-full bg-blue-600" />
      </div>

      {/* Status Badges Header: Active Card & 13.56 MHz NFC */}
      <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Kartu Siap Digunakan
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-700">
          <Radio className="w-3 h-3 text-cyan-400" />
          13.56 MHz ISO 14443-A
        </span>
      </div>

      {/* Main Title & User Direct Action Notification */}
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display text-center">
        {card.name}
      </h1>
      <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
        {card.addr || 'Profil bisnis terhubung ke Google Maps'}
      </p>

      {/* Highlight Box: Direct Entry to Review Menu on Tap */}
      <div className="mt-3.5 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 flex items-start gap-2.5 text-xs">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-blue-950 font-bold">
            Langsung Masuk ke Menu Ulasan saat NFC di-tap:
          </strong>
          <span className="text-[11.5px] text-blue-800 leading-relaxed block mt-0.5">
            Saat pelanggan menempelkan smartphone ke kartu NFC ini, HP otomatis membuka <strong>Menu Ulasan {card.name}</strong>. Rating 4–5 diarahkan ke Google Review, rating 1–3 dialihkan ke WhatsApp pemilik.
          </span>
        </div>
      </div>

      {/* Google Maps Connection Card (Guaranteed NO 404) */}
      <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-blue-50/60 border border-emerald-200/80 text-left">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
          <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            Terkoneksi Google Maps (Bebas 404)
          </span>
          {card.googleMapsRating && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10.5px]">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              {card.googleMapsRating}
              {card.googleMapsTotalReviews && (
                <span className="text-slate-500 font-normal">({card.googleMapsTotalReviews})</span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Lihat di Maps</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>

          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <span>Uji Buka Link Ulasan</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* 13.56 MHz NFC Physical Card Specification Box */}
      <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-white text-left relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Chip Kartu NFC 13.56 MHz</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            ISO 14443-A
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">UID Kartu:</span>
            <span className="text-cyan-200 font-bold truncate block">
              {card.nfcUid || '04:A8:1F:B3:2E:77'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Tipe Chip:</span>
            <span className="text-white truncate block">
              {card.nfcChipType || 'NTAG213 (13.56 MHz)'}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10.5px] text-slate-400">
            Target: Menu Ulasan Pintar
          </span>
          <button
            type="button"
            onClick={onOpenNfcConnection}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
          >
            Tulis / Input ke Tag NFC HP →
          </button>
        </div>
      </div>

      {/* WhatsApp Feedback & Destination Link */}
      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Filter Pemilik:</span>
        </div>
        <span className="font-mono font-semibold text-slate-800">
          {formatWhatsAppDisplay(card.wa)}
        </span>
      </div>

      {/* Quick Simulated Stats */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
          <span className="block text-[10px] text-slate-500 font-medium">Total Tap</span>
          <span className="text-base font-extrabold text-slate-900 font-mono">
            {stats.totalTaps}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-center">
          <span className="block text-[10px] text-amber-700 font-medium">Bintang 4-5 ⭐</span>
          <span className="text-base font-extrabold text-amber-700 font-mono">
            {stats.positiveRedirects}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-center">
          <span className="block text-[10px] text-emerald-700 font-medium">Filter WA</span>
          <span className="text-base font-extrabold text-emerald-700 font-mono">
            {stats.negativeIntercepted}
          </span>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="mt-4 space-y-2.5">
        <button
          onClick={() => {
            sound.playNfcTap();
            onSimulateNfc();
          }}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Simulasi Tap HP ke Kartu NFC 13.56 MHz</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenNfcConnection}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tulis ke Tag NFC</span>
          </button>

          <button
            onClick={onTryCustomer}
            className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-slate-800" />
            <span>Buka Menu Ulasan</span>
          </button>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Pengaturan Bisnis & PIN</span>
        </button>

        <button
          onClick={onResetCard}
          className="w-full py-2 text-xs text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center justify-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Aktifkan ulang kartu (Format data)</span>
        </button>
      </div>
    </div>
  );
};
