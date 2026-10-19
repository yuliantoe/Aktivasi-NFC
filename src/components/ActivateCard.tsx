import React, { useState, useRef } from 'react';
import { CardData, BusinessPreset } from '../types';
import {
  INDONESIAN_BUSINESS_PRESETS,
  hashString,
  generateGooglePlaceId,
  buildGoogleMapsSearchUrl,
  normalizeWhatsApp,
  formatWhatsAppDisplay,
} from '../data/presets';
import {
  Check,
  X,
  Search,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Building2,
  MapPin,
  ExternalLink,
  Radio,
  Cpu,
  Star,
  CheckCircle2,
  Camera,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { isWebNfcSupported, NfcService, generate1356Uid } from '../utils/nfc';
import { ScanQrModal } from './ScanQrModal';

interface ActivateCardProps {
  cardId: string;
  onActivated: (card: CardData) => void;
}

export const ActivateCard: React.FC<ActivateCardProps> = ({ cardId, onActivated }) => {
  const [activeCardId, setActiveCardId] = useState(cardId);
  const [bizQuery, setBizQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<{
    id: string;
    name: string;
    addr: string;
    rating?: number;
    reviews?: number;
    googleMapsUrl?: string;
  } | null>(null);
  const [waInput, setWaInput] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [customReviewUrl, setCustomReviewUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // NFC 13.56 MHz hardware / connection state
  const [nfcUid, setNfcUid] = useState<string>(() => generate1356Uid());
  const [isScanningNfc, setIsScanningNfc] = useState(false);
  const [nfcDetected, setNfcDetected] = useState(true);
  const [showScanQrModal, setShowScanQrModal] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Filter business presets connected with Google Maps
  const filteredPresets = INDONESIAN_BUSINESS_PRESETS.filter(
    (b) =>
      b.name.toLowerCase().includes(bizQuery.toLowerCase()) ||
      b.addr.toLowerCase().includes(bizQuery.toLowerCase())
  );

  const handleSelectBusiness = (preset: BusinessPreset) => {
    const id = preset.placeId || generateGooglePlaceId(preset.name);
    setSelectedPlace({
      id,
      name: preset.name,
      addr: preset.addr,
      rating: preset.rating || 4.9,
      reviews: preset.reviews || 250,
      googleMapsUrl: preset.googleMapsUrl || buildGoogleMapsSearchUrl(preset.name, preset.addr),
    });
    setBizQuery('');
    setIsDropdownOpen(false);
    setErrorMsg('');
    sound.playStarPing(1);
  };

  const handleCustomBusinessSubmit = () => {
    if (!bizQuery.trim()) return;
    const name = bizQuery.trim();
    const addr = 'Lokasi bisnis terverifikasi di Google Maps';
    const id = generateGooglePlaceId(name);
    setSelectedPlace({
      id,
      name,
      addr,
      rating: 5.0,
      reviews: 1,
      googleMapsUrl: buildGoogleMapsSearchUrl(name),
    });
    setBizQuery('');
    setIsDropdownOpen(false);
    setErrorMsg('');
    sound.playStarPing(1);
  };

  const handleScanNfcTag = async () => {
    setIsScanningNfc(true);
    sound.playStarPing(2);

    try {
      await NfcService.scanPhysicalCard(
        (result) => {
          setIsScanningNfc(false);
          setNfcUid(result.serialNumber);
          setNfcDetected(true);
          sound.playNfcTap();
        },
        (err) => {
          setIsScanningNfc(false);
          setErrorMsg(err);
        }
      );
    } catch (e: any) {
      setIsScanningNfc(false);
      setErrorMsg(e?.message || 'Gagal memindai kartu NFC.');
    }
  };

  const handlePinChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const nextDigits = [...pinDigits];
    nextDigits[index] = clean;
    setPinDigits(nextDigits);
    setErrorMsg('');

    if (clean && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const nextDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setPinDigits(nextDigits);
    const focusIdx = Math.min(pasted.length, 3);
    pinRefs[focusIdx].current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPlace) {
      setErrorMsg('Ketik nama bisnis dan pilih bisnis yang sesuai dari hasil pencarian.');
      return;
    }

    const normWa = normalizeWhatsApp(waInput);
    if (!normWa) {
      setErrorMsg('Nomor WhatsApp belum valid. Contoh format: 08123456789 atau 628123456789.');
      return;
    }

    const fullPin = pinDigits.join('');
    if (!/^\d{4}$/.test(fullPin)) {
      setErrorMsg('Buat PIN 4 digit angka untuk keamanan kartu.');
      return;
    }

    const newCard: CardData = {
      id: activeCardId,
      placeId: selectedPlace.id,
      name: selectedPlace.name,
      addr: selectedPlace.addr,
      wa: normWa,
      pin: fullPin,
      customUrl: customReviewUrl.trim() || selectedPlace.googleMapsUrl || buildGoogleMapsSearchUrl(selectedPlace.name, selectedPlace.addr),
      createdAt: new Date().toISOString(),
      // 13.56 MHz NFC specifications
      nfcUid,
      nfcFrequency: '13.56 MHz',
      nfcChipType: 'NTAG213 (13.56 MHz ISO/IEC 14443-A)',
      nfcStatus: 'connected',
      lastNfcSync: new Date().toISOString(),
      // Google Maps connection
      googleMapsUrl: selectedPlace.googleMapsUrl || buildGoogleMapsSearchUrl(selectedPlace.name, selectedPlace.addr),
      googleMapsRating: selectedPlace.rating,
      googleMapsTotalReviews: selectedPlace.reviews,
    };

    sound.playSuccess();
    onActivated(newCard);
  };

  return (
    <div>
      {/* 4-Step Visual Progress Breadcrumb */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-3 px-0.5">
        <span className="text-blue-600 font-bold flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
          Tap/Scan
        </span>
        <span className="text-slate-300">→</span>
        <span className={selectedPlace ? 'text-blue-600 font-bold' : ''}>
          2. Pilih Bisnis
        </span>
        <span className="text-slate-300">→</span>
        <span className={pinDigits.every((d) => d) ? 'text-blue-600 font-bold' : ''}>
          3. Buat PIN
        </span>
        <span className="text-slate-300">→</span>
        <span>4. Selesai</span>
      </div>

      <div className="flex gap-1.5 mb-5">
        <span className="flex-1 h-1.5 rounded-full bg-blue-600" />
        <span className={`flex-1 h-1.5 rounded-full ${selectedPlace ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <span className={`flex-1 h-1.5 rounded-full ${pinDigits.every((d) => d) ? 'bg-blue-600' : 'bg-slate-200'}`} />
      </div>

      {/* Main Title & User's Exact Copywriting */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Aktivasi Kartu NFC
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            #{activeCardId}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
          Aktivasi Kartu Ulasan
        </h1>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
          <strong>Langkah mudah:</strong> Tap kartu atau scan QR Code, ketik nama bisnis, pilih bisnis yang sesuai, buat PIN, dan selesai. Kartu siap digunakan.
        </p>
      </div>

      {/* Step 1: Tap Kartu NFC atau Scan QR Code Card */}
      <div className="mb-5 p-3 rounded-2xl bg-slate-900 text-white space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold text-cyan-300">1. Tap Kartu atau Scan QR Code</span>
          </div>
          <span className="text-[10px] font-mono text-slate-300">
            13.56 MHz (ISO 14443-A)
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Status Kartu Fisik:</span>
            <span className="font-mono text-cyan-200 font-bold">
              ✓ Terhubung (#{activeCardId})
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Chip UID:</span>
            <span className="font-mono text-slate-200 text-[10px]">{nfcUid.slice(0, 14)}</span>
          </div>
        </div>

        {/* Dual Trigger Action: Tap NFC or Scan QR Code */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleScanNfcTag}
            disabled={isScanningNfc}
            className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Radio className="w-3 h-3 text-cyan-300" />
            <span>{isScanningNfc ? 'Membaca...' : 'Tap Kartu NFC'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowScanQrModal(true)}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
          >
            <Camera className="w-3 h-3" />
            <span>Scan QR Code</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Step 2: Ketik nama bisnis & pilih bisnis yang sesuai */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="biz-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Ketik & Pilih Nama Bisnis
            </label>
            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" /> Google Maps
            </span>
          </div>

          {selectedPlace ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-blue-50/70 border border-emerald-200 text-slate-900 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedPlace.name}</p>
                    <p className="text-xs text-slate-600 line-clamp-1">{selectedPlace.addr}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlace(null);
                    setBizQuery('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Ganti bisnis"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Google Maps verification pill and test link */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bisnis Sesuai (Bebas 404)</span>
                  {selectedPlace.rating && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      {selectedPlace.rating}
                    </span>
                  )}
                </div>
                <a
                  href={customReviewUrl.trim() || selectedPlace.googleMapsUrl || buildGoogleMapsSearchUrl(selectedPlace.name, selectedPlace.addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                  title="Buka halaman untuk memastikan ulasan aktif dan tidak 404"
                >
                  <span>Tes Buka Link Ulasan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="biz-input"
                  type="text"
                  value={bizQuery}
                  onChange={(e) => {
                    setBizQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Ketik nama bisnis (cth: Kopi Kenangan, Klinik...)"
                  autoComplete="off"
                  className="w-full pl-10 pr-24 py-3 bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400"
                />
                {bizQuery.trim().length > 0 && (
                  <a
                    href={buildGoogleMapsSearchUrl(bizQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1"
                    title="Cari lokasi ini langsung di Google Maps"
                  >
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>Maps</span>
                  </a>
                )}
              </div>

              {/* Suggestions Dropdown with Google Maps Places */}
              {isDropdownOpen && (bizQuery.trim().length > 0 || filteredPresets.length > 0) && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Pilih Bisnis yang Sesuai</span>
                    <span>Google Maps</span>
                  </div>

                  {filteredPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectBusiness(preset)}
                      className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold text-slate-900 truncate">{preset.name}</span>
                          {preset.rating && (
                            <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-amber-600 shrink-0">
                              ★ {preset.rating}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{preset.addr}</div>
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">Pilih Bisnis Ini →</div>
                      </div>
                    </button>
                  ))}

                  {bizQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleCustomBusinessSubmit}
                      className="w-full text-left p-3 bg-blue-50/70 hover:bg-blue-50 transition-colors text-blue-700 flex items-center gap-2 cursor-pointer font-medium text-xs"
                    >
                      <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
                      <div>
                        Gunakan bisnis baru: <strong>"{bizQuery.trim()}"</strong>
                        <span className="block text-[10.5px] text-slate-500">Otomatis dihubungkan ke tautan ulasan Google Maps</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-[11.5px] text-slate-500 mt-1.5">
            Ketik nama usaha Anda lalu klik bisnis yang sesuai dari hasil pencarian.
          </p>
        </div>

        {/* WhatsApp Owner Number */}
        <div>
          <label htmlFor="wa-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nomor WhatsApp Pemilik (Filter Keluhan)
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="wa-input"
              type="tel"
              inputMode="tel"
              value={waInput}
              onChange={(e) => setWaInput(e.target.value)}
              placeholder="08123456789"
              autoComplete="tel"
              className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center justify-between text-[11.5px] text-slate-500 mt-1.5">
            <span>Ulasan bintang 1–3 dialihkan ke WhatsApp ini.</span>
            {waInput && (
              <span className="font-mono text-blue-600 font-semibold">
                {formatWhatsAppDisplay(normalizeWhatsApp(waInput) || '')}
              </span>
            )}
          </div>
        </div>

        {/* Step 3: Buat PIN */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Buat PIN Keamanan (4 Digit)
            </label>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Kunci Pengaturan
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pinDigits.map((digit, i) => (
              <input
                key={i}
                ref={pinRefs[i]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                onPaste={i === 0 ? handlePinPaste : undefined}
                className="w-10 h-10 text-center text-base font-mono font-bold rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                aria-label={`Digit PIN ke-${i + 1}`}
              />
            ))}
          </div>
          <p className="text-[11.5px] text-slate-500 mt-1.5">
            PIN 4 digit ini digunakan untuk mengamankan dan mengedit kartu.
          </p>
        </div>

        {/* Advanced Options Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <span>Pengaturan Lanjutan (Link Google Maps Manual)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label htmlFor="custom-url" className="block text-[11px] font-bold text-slate-600">
                URL Google Review / Place ID Kustom
              </label>
              <input
                id="custom-url"
                type="url"
                value={customReviewUrl}
                onChange={(e) => setCustomReviewUrl(e.target.value)}
                placeholder="https://g.page/r/.../review atau https://maps.app.goo.gl/..."
                className="w-full px-3 py-2 text-xs bg-white text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
              />
              <p className="text-[10.5px] text-slate-500">
                Opsional. Jika kosong, sistem otomatis membuat link ulasan resmi dari profil bisnis Google Maps.
              </p>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 4: Submit Button: Selesai. Kartu siap digunakan */}
        <button
          type="submit"
          className="w-full mt-4 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Selesai · Kartu Siap Digunakan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* QR Scanner Modal */}
      {showScanQrModal && (
        <ScanQrModal
          currentCardId={activeCardId}
          onCardDetected={(detectedId) => {
            setActiveCardId(detectedId);
            setNfcDetected(true);
            setShowScanQrModal(false);
          }}
          onClose={() => setShowScanQrModal(false)}
        />
      )}
    </div>
  );
};
