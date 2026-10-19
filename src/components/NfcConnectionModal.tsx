import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { CardData } from '../types';
import { isWebNfcSupported, NfcService, generate1356Uid, getNfcDiagnostic } from '../utils/nfc';
import { sound } from '../utils/audio';
import { getGoogleReviewUrl, buildNfcSmartReviewUrl, buildGoogleMapsSearchUrl } from '../data/presets';
import {
  Wifi,
  Radio,
  CheckCircle2,
  AlertTriangle,
  X,
  Smartphone,
  RefreshCw,
  Cpu,
  Download,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Sparkles,
  QrCode as QrIcon,
  Send,
  Play,
  Share2,
} from 'lucide-react';

interface NfcConnectionModalProps {
  card: CardData;
  onUpdateCardNfc: (nfcData: Partial<CardData>) => void;
  onClose: () => void;
}

export const NfcConnectionModal: React.FC<NfcConnectionModalProps> = ({
  card,
  onUpdateCardNfc,
  onClose,
}) => {
  const diagnostic = getNfcDiagnostic();
  const hasHardwareNfc = diagnostic.hasWebNfc;

  const [activeTab, setActiveTab] = useState<'direct_write' | 'phone_transfer' | 'nfc_tools' | 'read_scan'>('direct_write');
  const [urlMode, setUrlMode] = useState<'smart_review' | 'direct_google'>('smart_review');
  const [status, setStatus] = useState<'idle' | 'writing' | 'reading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scannedUid, setScannedUid] = useState<string>(card.nfcUid || '04:A8:1F:B3:2E:77:9C');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPhoneLink, setCopiedPhoneLink] = useState(false);
  const [phoneQrDataUrl, setPhoneQrDataUrl] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Compute URLs
  const smartReviewUrl = buildNfcSmartReviewUrl(card);
  const directGoogleUrl = getGoogleReviewUrl(card.placeId, card.customUrl, card.name, card.addr);
  const targetUrl = urlMode === 'smart_review' ? smartReviewUrl : directGoogleUrl;

  // Generate QR code for phone transfer
  useEffect(() => {
    const originUrl = typeof window !== 'undefined' ? window.location.href : '';
    QRCode.toDataURL(originUrl, { margin: 1, width: 220, color: { dark: '#0f172a', light: '#ffffff' } })
      .then((url) => setPhoneQrDataUrl(url))
      .catch((err) => console.error('Failed to generate phone transfer QR:', err));
  }, []);

  // Clean up any ongoing NFC write/read session when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartWrite = async (isTestSimulated = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setStatus('writing');
    setStatusMessage('Sensor NFC HP aktif! Tempelkan kartu NFC 13.56 MHz ke bagian belakang HP Anda sekarang...');
    sound.playStarPing(2);

    try {
      await NfcService.writeReviewUrlToCard(
        targetUrl,
        (uid) => {
          setStatus('success');
          setScannedUid(uid);
          setStatusMessage(
            urlMode === 'smart_review'
              ? 'Berhasil! Kartu NFC 13.56 MHz terhubung ke Menu Ulasan Pintar. Saat pelanggan menempelkan HP ke kartu, langsung masuk ke Menu Ulasan!'
              : 'Berhasil! Kartu NFC 13.56 MHz terhubung langsung ke profil ulasan Google Maps.'
          );
          sound.playSuccess();

          onUpdateCardNfc({
            nfcUid: uid,
            nfcFrequency: '13.56 MHz',
            nfcChipType: 'NTAG213 (13.56 MHz ISO/IEC 14443-A)',
            nfcStatus: 'written',
            lastNfcSync: new Date().toISOString(),
          });
        },
        (err) => {
          setStatus('error');
          setStatusMessage(err);
          sound.playStarPing(0);
        },
        ac.signal,
        isTestSimulated
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setStatus('error');
        setStatusMessage(e?.message || 'Terjadi gangguan koneksi NFC.');
      }
    }
  };

  const handleStartRead = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setStatus('reading');
    setStatusMessage('Mendengarkan tag NFC 13.56 MHz. Tempelkan kartu ke bagian belakang HP...');
    sound.playStarPing(1);

    try {
      await NfcService.scanPhysicalCard(
        (result) => {
          setStatus('success');
          setScannedUid(result.serialNumber);
          setStatusMessage(`Kartu 13.56 MHz terdeteksi! UID: ${result.serialNumber}`);
          sound.playNfcTap();

          onUpdateCardNfc({
            nfcUid: result.serialNumber,
            nfcFrequency: '13.56 MHz',
            nfcChipType: result.chipType,
            nfcStatus: 'connected',
            lastNfcSync: new Date().toISOString(),
          });
        },
        (err) => {
          setStatus('error');
          setStatusMessage(err);
        },
        ac.signal
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setStatus('error');
        setStatusMessage(e?.message || 'Gagal membaca kartu NFC.');
      }
    }
  };

  const handleCancelNfc = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus('idle');
    setStatusMessage('');
  };

  const handleCopyTargetUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopiedUrl(true);
    sound.playStarPing(3);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyPhoneLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedPhoneLink(true);
      sound.playStarPing(3);
      setTimeout(() => setCopiedPhoneLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Koneksi Kartu NFC 13.56 MHz
              </h3>
              <p className="text-[11px] text-slate-500">
                Input data ulasan {card.name} dari website ke chip NFC fisik
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleCancelNfc();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Target Choice: Smart Review Menu vs Direct Google Maps */}
        <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Tujuan Tautan Saat Kartu Ditap di HP:
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-bold">
              13.56 MHz NDEF
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setUrlMode('smart_review');
                sound.playStarPing(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                urlMode === 'smart_review'
                  ? 'bg-white border-blue-600 shadow-sm text-blue-950 ring-2 ring-blue-500/20'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Menu Ulasan Pintar</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                (Rekomendasi) Pelanggan langsung masuk menu ulasan. Bintang 4-5 ke Google Maps, 1-3 difilter ke WA.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setUrlMode('direct_google');
                sound.playStarPing(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                urlMode === 'direct_google'
                  ? 'bg-white border-blue-600 shadow-sm text-blue-950 ring-2 ring-blue-500/20'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Langsung Google Maps</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                Buka halaman Google Maps bisnis secara langsung (bebas 404) tanpa form ulasan web.
              </p>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              setActiveTab('direct_write');
            }}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer text-center truncate ${
              activeTab === 'direct_write'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tulis Web NFC
          </button>
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              setActiveTab('phone_transfer');
            }}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer text-center truncate ${
              activeTab === 'phone_transfer'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buka di HP Anda
          </button>
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              setActiveTab('nfc_tools');
            }}
            className={`py-2 px-1 rounded-lg transition-all cursor-pointer text-center truncate ${
              activeTab === 'nfc_tools'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aplikasi NFC Tools
          </button>
        </div>

        {/* Diagnostic Device Alert */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-900 text-white text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-cyan-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {diagnostic.platformDescription}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                hasHardwareNfc
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {hasHardwareNfc ? '✓ Web NFC Aktif' : 'NFC Sensor di HP'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {diagnostic.recommendation}
          </p>
        </div>

        {/* TAB 1: Direct Web NFC Write */}
        {activeTab === 'direct_write' && (
          <div className="mt-3 space-y-3.5">
            {/* Visualizer & Contact Animation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative w-32 h-32 flex items-center justify-center my-1">
                {status === 'writing' && (
                  <>
                    <span className="absolute w-20 h-20 rounded-full border-2 border-blue-500 animate-ping" />
                    <span className="absolute w-28 h-28 rounded-full border border-cyan-400 animate-ping [animation-delay:200ms]" />
                    <span className="absolute w-36 h-36 rounded-full border border-cyan-300/50 animate-ping [animation-delay:400ms]" />
                  </>
                )}

                {/* NFC Card Graphic */}
                <div
                  className={`w-32 aspect-[1.58/1] rounded-xl p-2.5 shadow-md border flex flex-col justify-between transition-all duration-300 z-10 ${
                    status === 'success'
                      ? 'bg-emerald-900 border-emerald-500 text-white shadow-emerald-500/20 scale-105'
                      : status === 'writing'
                      ? 'bg-slate-900 border-cyan-400 text-white animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400 rotate-90" />
                    <span className="text-[8px] font-mono text-cyan-300 font-bold">13.56 MHz</span>
                  </div>
                  <div className="w-5 h-3 rounded bg-amber-400/90" />
                  <div>
                    <p className="text-[9px] font-bold truncate text-white">{card.name}</p>
                    <p className="text-[7.5px] font-mono text-slate-400 truncate">UID: {scannedUid.slice(0, 11)}...</p>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              {status === 'idle' && (
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-800">
                    Siap Memasukkan Data ke Tag NFC 13.56 MHz
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik tombol di bawah lalu tempelkan kartu NFC ke bagian belakang bodi smartphone Anda.
                  </p>
                </div>
              )}

              {status === 'writing' && (
                <div className="inline-flex flex-col items-center gap-1 text-xs">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center gap-1.5 animate-pulse">
                    <Radio className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Mendeteksi Kartu NFC 13.56 MHz...
                  </span>
                  <p className="text-[11.5px] text-slate-700 font-medium mt-1">
                    Tempelkan kartu ke bodi belakang HP Anda & tahan 1–2 detik sampai HP bergetar.
                  </p>
                </div>
              )}

              {status === 'success' && (
                <div className="inline-flex flex-col items-center gap-1 text-xs text-emerald-800">
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Sukses Ditulis ke Chip NFC!
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Tag UID: <strong className="font-mono text-slate-800">{scannedUid}</strong> · Kartu siap ditap oleh pelanggan!
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left w-full space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Perhatian:</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed">{statusMessage}</p>
                </div>
              )}
            </div>

            {/* Target URL details */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-bold text-blue-800 uppercase">
                <span>Tautan yang Dimasukkan ke Chip:</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {urlMode === 'smart_review' ? 'Menu Ulasan Pintar' : 'Google Maps'}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-800 break-all select-all">
                {targetUrl}
              </p>
            </div>

            {/* Main Interactive Button (Enforces User Gesture) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleStartWrite(false)}
                disabled={status === 'writing'}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                <span>
                  {status === 'writing'
                    ? 'Sedang Menunggu Tempelan Kartu...'
                    : hasHardwareNfc
                    ? 'Mulai Tulis ke Tag NFC Sekarang'
                    : 'Tulis ke Tag NFC (HP Android Chrome)'}
                </span>
              </button>

              {!hasHardwareNfc && (
                <button
                  type="button"
                  onClick={() => handleStartWrite(true)}
                  disabled={status === 'writing'}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-slate-600" />
                  <span>Simulasi Tulis ke Kartu (Mode Pengujian di Desktop)</span>
                </button>
              )}

              {status === 'writing' && (
                <button
                  type="button"
                  onClick={handleCancelNfc}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Batal / Hentikan Penulisan
                </button>
              )}
            </div>

            {/* Quick Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-800">Panduan Praktis Menulis NFC dari HP:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Buka website ini di <strong>Google Chrome HP Android</strong>.</li>
                <li>Nyalakan NFC di <strong>Pengaturan HP &gt; Koneksi &gt; NFC</strong>.</li>
                <li>Tempelkan kartu NFC 13.56 MHz (NTAG213/215) ke bagian tengah/atas bodi belakang HP.</li>
                <li>Tahan selama 1-2 detik hingga terdengar bunyi getar / konfirmasi sukses.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: Transfer Session to Phone */}
        {activeTab === 'phone_transfer' && (
          <div className="mt-3 space-y-3.5 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center">
              <span className="text-xs font-bold text-slate-900 mb-1">
                Buka Dasbor Ini Langsung di Handphone Anda
              </span>
              <p className="text-[11.5px] text-slate-500 max-w-xs mb-3">
                Scan QR Code ini menggunakan kamera HP Anda untuk membuka dasbor ini di Google Chrome HP, sehingga sensor NFC HP bisa langsung menulis ke kartu.
              </p>

              {phoneQrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <img
                    src={phoneQrDataUrl}
                    alt="Scan untuk buka di HP"
                    className="w-44 h-44 rounded-lg mx-auto"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={handleCopyPhoneLink}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPhoneLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhoneLink ? 'Link Tersalin!' : 'Salin Link'}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Buka dasbor Kartu Ulasan NFC di Google Chrome HP: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim ke WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Universal NFC Tools App Guide */}
        {activeTab === 'nfc_tools' && (
          <div className="mt-3 space-y-3.5 text-xs text-slate-700">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cara Paling Universal & Cepat (Android & iPhone):</span>
              </div>
              <p className="text-[11.5px] text-amber-800 leading-relaxed">
                Aplikasi gratis <strong>"NFC Tools"</strong> adalah standar industri untuk menulis tag NFC 13.56 MHz (NTAG213/215). Bekerja 100% di semua HP Android dan iPhone!
              </p>
            </div>

            {/* Copy Review Link Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Langkah 1: Salin Tautan Ulasan {card.name}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={targetUrl}
                  className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyTargetUrl}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Step by Step Guide */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Langkah 2: Tulis ke Tag NFC di HP Anda
              </span>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11.5px] text-slate-600">
                <li>
                  Download aplikasi <strong>NFC Tools</strong> (gratis di Google Play Store atau Apple App Store).
                </li>
                <li>Buka aplikasi NFC Tools &gt; Pilih menu <strong>"Write" (Tulis)</strong>.</li>
                <li>
                  Klik <strong>"Add a record"</strong> &gt; pilih <strong>"Custom URL / URI"</strong>.
                </li>
                <li>
                  Paste (tempel) tautan ulasan yang sudah disalin di atas &gt; klik <strong>OK</strong>.
                </li>
                <li>
                  Klik tombol <strong>"Write / [ukuran byte]"</strong>, lalu tempelkan kartu NFC 13.56 MHz ke belakang bodi HP.
                </li>
                <li>
                  Selesai! Kartu NFC siap digunakan. Saat pelanggan menempelkan HP ke kartu, langsung masuk ke Menu Ulasan!
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
