import React, { useState, useRef, useEffect } from 'react';
import { CardData } from '../types';
import { isWebNfcSupported, NfcService, generate1356Uid, getNfcDiagnostic } from '../utils/nfc';
import { sound } from '../utils/audio';
import { getGoogleReviewUrl } from '../data/presets';
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

  const [activeTab, setActiveTab] = useState<'direct_write' | 'nfc_tools' | 'read_scan'>('direct_write');
  const [status, setStatus] = useState<'idle' | 'writing' | 'reading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scannedUid, setScannedUid] = useState<string>(card.nfcUid || '04:A8:1F:B3:2E:77:9C');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const targetUrl = getGoogleReviewUrl(card.placeId, card.customUrl, card.name, card.addr);

  // Clean up any ongoing NFC write/read session when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartWrite = async () => {
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
          setStatusMessage('Berhasil! Tautan ulasan Google berhasil ditulis ke dalam chip NFC 13.56 MHz.');
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
        ac.signal
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Koneksi Kartu NFC 13.56 MHz
              </h3>
              <p className="text-[11px] text-slate-500">
                Tulis tautan Google Review ke chip fisik NTAG213/215/216
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

        {/* Tab selection */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              setActiveTab('direct_write');
            }}
            className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'direct_write'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tulis Langsung (Web NFC)
          </button>
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              setActiveTab('nfc_tools');
            }}
            className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'nfc_tools'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aplikasi NFC Tools
          </button>
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              setActiveTab('read_scan');
            }}
            className={`flex-1 py-2 px-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === 'read_scan'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Baca UID Tag
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
              {hasHardwareNfc ? '✓ Web NFC Aktif' : 'NFC via App/Desktop'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {diagnostic.recommendation}
          </p>
        </div>

        {/* TAB 1: Direct Web NFC Write */}
        {activeTab === 'direct_write' && (
          <div className="mt-4 space-y-4">
            {/* Visualizer & Contact Animation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
              <div className="relative w-36 h-36 flex items-center justify-center my-2">
                {status === 'writing' && (
                  <>
                    <span className="absolute w-20 h-20 rounded-full border-2 border-blue-500 animate-ping" />
                    <span className="absolute w-32 h-32 rounded-full border border-cyan-400 animate-ping [animation-delay:200ms]" />
                    <span className="absolute w-40 h-40 rounded-full border border-cyan-300/50 animate-ping [animation-delay:400ms]" />
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
                    <p className="text-[7.5px] font-mono text-slate-400">UID: {scannedUid.slice(0, 11)}...</p>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              {status === 'idle' && (
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-800">Siap Menulis ke Tag NFC 13.56 MHz</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik tombol di bawah lalu tempelkan kartu/stiker NFC ke bodi belakang smartphone Anda.
                  </p>
                </div>
              )}

              {status === 'writing' && (
                <div className="inline-flex flex-col items-center gap-1 text-xs">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center gap-1.5 animate-pulse">
                    <Radio className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    Mendeteksi Kartu NFC...
                  </span>
                  <p className="text-[11.5px] text-slate-700 font-medium mt-1">
                    Tempelkan kartu NFC ke bagian belakang HP & tahan 1-2 detik hingga HP bergetar.
                  </p>
                </div>
              )}

              {status === 'success' && (
                <div className="inline-flex flex-col items-center gap-1 text-xs text-emerald-800">
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Sukses Ditulis ke Chip 13.56 MHz!
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Tag UID: <strong className="font-mono text-slate-800">{scannedUid}</strong>
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
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
              <span className="text-[10.5px] font-bold text-blue-800 block uppercase">
                Tautan Ulasan yang Dimasukkan ke Chip:
              </span>
              <p className="font-mono text-[11px] text-slate-800 break-all select-all">
                {targetUrl}
              </p>
            </div>

            {/* Main Interactive Button (Enforces User Gesture) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleStartWrite}
                disabled={status === 'writing'}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                <span>
                  {status === 'writing'
                    ? 'Sedang Menunggu Tempelan Kartu...'
                    : 'Mulai Tulis ke Tag NFC Sekarang'}
                </span>
              </button>

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
              <p className="font-bold text-slate-800">Tips jika belum merespons:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Buka <strong>Pengaturan HP &gt; Koneksi &gt; NFC</strong> dan pastikan statusnya <strong>AKTIF</strong>.</li>
                <li>Gunakan browser <strong>Google Chrome di Android</strong>.</li>
                <li>Lepas casing tebal HP bila menghalangi gelombang antena 13.56 MHz.</li>
                <li>Letak sensor NFC HP biasanya di bagian tengah belakang atau dekat kamera.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: Universal NFC Tools App Guide */}
        {activeTab === 'nfc_tools' && (
          <div className="mt-4 space-y-4 text-xs text-slate-700">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cara Paling Universal & Cepat (Android & iPhone):</span>
              </div>
              <p className="text-[11.5px] text-amber-800 leading-relaxed">
                Jika browser HP Anda memblokir izin Web NFC, Anda bisa menggunakan aplikasi gratis <strong>"NFC Tools"</strong> (standar resmi industri untuk tulis tag NTAG213/215).
              </p>
            </div>

            {/* Copy Review Link Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Langkah 1: Salin Tautan Ulasan Google Anda
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
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-800 block text-xs">
                Langkah 2: Tulis ke Tag NFC dengan NFC Tools
              </span>
              <ol className="list-decimal pl-4 space-y-1.5 text-[11.5px] text-slate-600">
                <li>
                  Download aplikasi <strong>NFC Tools</strong> (gratis di Play Store untuk Android atau App Store untuk iPhone).
                </li>
                <li>Buka aplikasi NFC Tools &gt; Pilih tab <strong>"Write" (Tulis)</strong>.</li>
                <li>
                  Pilih <strong>"Add a record"</strong> &gt; pilih <strong>"Custom URL / URI"</strong>.
                </li>
                <li>
                  Tempelkan (Paste) link ulasan yang sudah disalin tadi &gt; klik <strong>OK</strong>.
                </li>
                <li>
                  Klik tombol <strong>"Write / [ukuran byte]"</strong>, lalu tempelkan kartu/stiker NFC 13.56 MHz Anda ke belakang HP.
                </li>
                <li>
                  Selesai! Kartu Anda sekarang langsung membuka ulasan bisnis saat di-tap oleh siapa saja.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 3: Read & Diagnostic Tag Scan */}
        {activeTab === 'read_scan' && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Pindai & Cek Spesifikasi Tag</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Membaca nomor serial UID dan kapasitas chip 13.56 MHz yang ditempelkan.
                </p>
              </div>

              {status === 'reading' && (
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-semibold animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mendekatkan kartu NFC 13.56 MHz ke sensor HP...</span>
                </div>
              )}

              {status === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kartu 13.56 MHz Terbaca:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[11px]">
                    <span className="text-slate-500">Tag UID:</span>
                    <span className="font-bold text-slate-900">{scannedUid}</span>
                    <span className="text-slate-500">Frekuensi:</span>
                    <span className="text-slate-900">13.56 MHz High-Frequency</span>
                    <span className="text-slate-500">Standar:</span>
                    <span className="text-slate-900">ISO/IEC 14443 Type A</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStartRead}
                disabled={status === 'reading'}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>{status === 'reading' ? 'Menunggu Tempelan Tag...' : 'Mulai Scan Kartu NFC'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            NFC 13.56 MHz (ISO 14443-A)
          </span>
          <button
            type="button"
            onClick={() => {
              handleCancelNfc();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
