import React, { useState } from 'react';
import { CardData } from '../types';
import { normalizeWhatsApp, formatWhatsAppDisplay, buildGoogleMapsSearchUrl } from '../data/presets';
import {
  X,
  Save,
  Trash2,
  KeyRound,
  Smartphone,
  Building2,
  MapPin,
  Radio,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { generate1356Uid } from '../utils/nfc';

interface SettingsModalProps {
  card: CardData;
  onSave: (updated: CardData) => void;
  onReset: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  card,
  onSave,
  onReset,
  onClose,
}) => {
  const [name, setName] = useState(card.name);
  const [addr, setAddr] = useState(card.addr || '');
  const [wa, setWa] = useState(card.wa);
  const [pin, setPin] = useState(card.pin);
  const [customUrl, setCustomUrl] = useState(card.customUrl || '');
  const [nfcUid, setNfcUid] = useState(card.nfcUid || '04:A8:1F:B3:2E:77');
  const [error, setError] = useState('');

  const mapsUrl = card.googleMapsUrl || buildGoogleMapsSearchUrl(name, addr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama bisnis tidak boleh kosong.');
      return;
    }

    const normWa = normalizeWhatsApp(wa);
    if (!normWa) {
      setError('Nomor WhatsApp belum valid.');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN harus 4 digit angka.');
      return;
    }

    const updated: CardData = {
      ...card,
      name: name.trim(),
      addr: addr.trim() || undefined,
      wa: normWa,
      pin,
      customUrl: customUrl.trim() || buildGoogleMapsSearchUrl(name.trim(), addr.trim()),
      nfcUid,
      googleMapsUrl: mapsUrl,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 font-bold">
            NFC 13.56 MHz
          </span>
          <span className="text-xs text-slate-400">#{card.id}</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 font-display">
          Pengaturan Kartu Ulasan
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Perbarui nama bisnis Google Maps, WhatsApp ulasan, dan spesifikasi chip 13.56 MHz.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Business Name with Google Maps shortcut */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nama Bisnis di Google Maps
              </label>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3 text-red-500" />
                <span>Cek di Maps</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Lengkap / Wilayah
            </label>
            <input
              type="text"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Contoh: Jl. Sudirman No. 12, Jakarta"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* NFC 13.56 MHz UID Configuration */}
          <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Radio className="w-3.5 h-3.5" />
                Tag NFC 13.56 MHz (ISO 14443-A)
              </span>
              <button
                type="button"
                onClick={() => setNfcUid(generate1356Uid())}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
              >
                Ganti UID Acak
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Chip UID:</span>
              <span className="text-cyan-200 font-bold">{nfcUid}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nomor WhatsApp Penerima Keluhan
            </label>
            <input
              type="tel"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Format: {formatWhatsAppDisplay(normalizeWhatsApp(wa) || '')}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              PIN Keamanan (4 Digit)
            </label>
            <input
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-28 px-3 py-2 text-center text-base rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono tracking-widest font-bold"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tautan Google Review (Bebas 404)
              </label>
              <a
                href={customUrl.trim() || buildGoogleMapsSearchUrl(name, addr)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                title="Cek apakah link ulasan berfungsi tanpa error 404"
              >
                <span>Tes Buka Link</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://g.page/r/... atau biarkan kosong untuk otomatis Google Maps"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-mono"
            />
            <p className="text-[10.5px] text-slate-500 mt-1">
              Bila kosong, sistem otomatis memakai profil Google Maps (dijamin bebas 404).
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium">⚠️ {error}</p>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin mereset kartu ini kembali ke kondisi kosong?')) {
                  onReset();
                  onClose();
                }
              }}
              className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center"
              title="Reset Kartu"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
