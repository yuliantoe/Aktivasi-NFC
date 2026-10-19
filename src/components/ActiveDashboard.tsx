import React, { useState } from 'react';
import { CardData, ReviewStats } from '../types';
import { getGoogleReviewUrl, formatWhatsAppDisplay, buildGoogleMapsSearchUrl } from '../data/presets';
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
  const [copied, setCopied] = useState(false);
  const reviewUrl = getGoogleReviewUrl(card.placeId, card.customUrl);
  const mapsSearchUrl = card.googleMapsUrl || buildGoogleMapsSearchUrl(card.name, card.addr);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Steps bar */}
      <div className="flex gap-1.5 mb-5">
        <span className="flex-1 h-1 rounded-full bg-blue-600" />
        <span className="flex-1 h-1 rounded-full bg-blue-600" />
        <span className="flex-1 h-1 rounded-full bg-slate-200" />
      </div>

      {/* Status Badges Header: Active Card & 13.56 MHz NFC */}
      <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Kartu Aktif
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-700">
          <Radio className="w-3 h-3 text-cyan-400" />
          13.56 MHz NFC
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display text-center">
        {card.name}
      </h1>
      <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
        {card.addr || 'Profil bisnis terhubung ke Google Maps'}
      </p>

      {/* Google Maps Connection Card */}
      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-emerald-50/60 border border-blue-200/80 text-left">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
          <span className="flex items-center gap-1.5 text-blue-700">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            Terkoneksi Google Maps
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

        <p className="text-xs text-slate-600 line-clamp-1 mb-2 font-mono">
          ID: {card.placeId}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t border-blue-200/60">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Buka Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>

          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <span>Uji Review Link</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* 13.56 MHz NFC Physical Card Specification Box */}
      <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-white text-left relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Koneksi Chip NFC 13.56 MHz</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            ISO 14443-A
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Chip UID:</span>
            <span className="text-cyan-200 font-bold truncate block">
              {card.nfcUid || '04:A8:1F:B3:2E:77'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Tipe Chip:</span>
            <span className="text-white truncate block">
              {card.nfcChipType || 'NTAG213 (13.56MHz)'}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10.5px] text-slate-400">
            Format: NDEF URL Smart Review
          </span>
          <button
            type="button"
            onClick={onOpenNfcConnection}
            className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
          >
            Input / Tulis ke Kartu Sekarang →
          </button>
        </div>
      </div>

      {/* WhatsApp Feedback & Destination Link */}
      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Filter:</span>
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
          <span className="block text-[10px] text-emerald-700 font-medium">Keluhan Filter</span>
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
            <span>Form Rating</span>
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
