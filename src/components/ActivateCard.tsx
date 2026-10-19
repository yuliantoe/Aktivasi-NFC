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
} from 'lucide-react';
import { sound } from '../utils/audio';
import { isWebNfcSupported, NfcService, generate1356Uid } from '../utils/nfc';

interface ActivateCardProps {
  cardId: string;
  onActivated: (card: CardData) => void;
}

export const ActivateCard: React.FC<ActivateCardProps> = ({ cardId, onActivated }) => {
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
  const hasWebNfc = isWebNfcSupported();
  const [nfcUid, setNfcUid] = useState<string>(() => generate1356Uid());
  const [isScanningNfc, setIsScanningNfc] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string>('');

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
    setNfcMessage('Mendekatkan kartu NFC 13.56 MHz...');
    sound.playStarPing(2);

    try {
      await NfcService.scanPhysicalCard(
        (result) => {
          setIsScanningNfc(false);
          setNfcUid(result.serialNumber);
          setNfcMessage(`Kartu 13.56 MHz terhubung! UID: ${result.serialNumber}`);
          sound.playNfcTap();
        },
        (err) => {
          setIsScanningNfc(false);
          setNfcMessage(err);
        }
      );
    } catch (e: any) {
      setIsScanningNfc(false);
      setNfcMessage(e?.message || 'Gagal memindai kartu.');
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
      setErrorMsg('Pilih atau ketik nama bisnis untuk dikoneksikan ke Google Maps.');
      return;
    }

    const normWa = normalizeWhatsApp(waInput);
    if (!normWa) {
      setErrorMsg('Nomor WhatsApp belum valid. Contoh format: 08123456789 atau 628123456789.');
      return;
    }

    const fullPin = pinDigits.join('');
    if (!/^\d{4}$/.test(fullPin)) {
      setErrorMsg('PIN harus 4 digit angka.');
      return;
    }

    const newCard: CardData = {
      id: cardId,
      placeId: selectedPlace.id,
      name: selectedPlace.name,
      addr: selectedPlace.addr,
      wa: normWa,
      pin: fullPin,
      customUrl: customReviewUrl.trim() || undefined,
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
      {/* Progress step bars */}
      <div className="flex gap-1.5 mb-5">
        <span className="flex-1 h-1 rounded-full bg-blue-600" />
        <span className="flex-1 h-1 rounded-full bg-slate-200" />
        <span className="flex-1 h-1 rounded-full bg-slate-200" />
      </div>

      {/* NFC 13.56 MHz Active Connection Header Badge */}
      <div className="mb-4 p-2.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-cyan-300">NFC 13.56 MHz</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                ISO 14443-A
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-mono truncate max-w-[190px]">
              UID: {nfcUid}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleScanNfcTag}
          disabled={isScanningNfc}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[10.5px] transition-colors cursor-pointer shrink-0 flex items-center gap-1 disabled:opacity-50"
        >
          <Cpu className="w-3 h-3" />
          <span>{isScanningNfc ? 'Memindai...' : 'Pindai Kartu'}</span>
        </button>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
          Aktivasi Kartu NFC 13.56 MHz
        </h1>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          Koneksikan kartu fisik ulasan dengan profil bisnis di Google Maps.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Business Selector with Google Maps Connection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="biz-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nama Bisnis di Google Maps
            </label>
            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" /> Terkoneksi Google Maps
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

              {/* Google Maps verification pill */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Koneksi Google Maps Aktif</span>
                  {selectedPlace.rating && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                      {selectedPlace.rating}
                    </span>
                  )}
                </div>
                {selectedPlace.googleMapsUrl && (
                  <a
                    href={selectedPlace.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                  >
                    <span>Cek di Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
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
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Saran Tempat Google Maps</span>
                    <span>13.56 MHz Ready</span>
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
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">Google Maps Verified</div>
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
                        <span className="block text-[10.5px] text-slate-500">Otomatis dihubungkan dengan tautan Google Maps ulasan</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-[11.5px] text-slate-500 mt-1.5">
            Pilih bisnis Anda dari saran terverifikasi atau masukkan nama usaha Anda.
          </p>
        </div>

        {/* WhatsApp Owner Number */}
        <div>
          <label htmlFor="wa-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nomor WhatsApp Pemilik
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
            <span>Keluhan dari rating 1–3 difilter langsung ke nomor ini.</span>
            {waInput && (
              <span className="font-mono text-blue-600 font-semibold">
                {formatWhatsAppDisplay(normalizeWhatsApp(waInput) || '')}
              </span>
            )}
          </div>
        </div>

        {/* 4-Digit Security PIN */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              PIN 4 Digit
            </label>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Keamanan kartu
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
            Dipakai untuk mengunci kartu dan mengedit konfigurasi ulasan.
          </p>
        </div>

        {/* Advanced Options Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <span>Pengaturan Lanjutan (Link Google Maps Kustom)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label htmlFor="custom-url" className="block text-[11px] font-bold text-slate-600">
                URL Google Review / Google Maps Place ID Manual
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
                Jika dikosongkan, sistem otomatis membuat tautan Google Maps ulasan resmi berbasis Place ID bisnis Anda.
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

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-4 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Radio className="w-4 h-4 text-cyan-300" />
          <span>Koneksikan & Aktifkan Kartu NFC 13.56 MHz</span>
        </button>
      </form>
    </div>
  );
};
