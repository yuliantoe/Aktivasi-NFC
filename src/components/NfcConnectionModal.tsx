import React, { useState, useEffect } from 'react';
import { CardData } from '../types';
import { isWebNfcSupported, NfcService, generate1356Uid } from '../utils/nfc';
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
  ShieldCheck,
  Check,
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
  const hasHardwareNfc = isWebNfcSupported();
  const [mode, setMode] = useState<'write' | 'read'>('write');
  const [status, setStatus] = useState<'idle' | 'listening' | 'writing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scannedUid, setScannedUid] = useState<string>(card.nfcUid || '04:A8:1F:B3:2E:77:9C');
  const [chipType, setChipType] = useState<string>(card.nfcChipType || 'NTAG213 (13.56 MHz)');
  const [writtenUrl, setWrittenUrl] = useState<string>('');

  const targetUrl = getGoogleReviewUrl(card.placeId, card.customUrl);

  const startNfcWrite = async () => {
    setStatus('writing');
    setStatusMessage('Tempelkan kartu NFC 13.56 MHz ke sensor HP...');
    sound.playStarPing(2);

    try {
      await NfcService.writeReviewUrlToCard(
        targetUrl,
        (uid) => {
          setStatus('success');
          setScannedUid(uid);
          setWrittenUrl(targetUrl);
          setStatusMessage('Berhasil menulis URL Google Review ke chip NFC 13.56 MHz!');
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
        }
      );
    } catch (e: any) {
      setStatus('error');
      setStatusMessage(e?.message || 'Gagal berkomunikasi dengan sensor NFC.');
    }
  };

  const startNfcRead = async () => {
    setStatus('listening');
    setStatusMessage('Mendengarkan kartu NFC 13.56 MHz...');
    sound.playStarPing(1);

    try {
      await NfcService.scanPhysicalCard(
        (result) => {
          setStatus('success');
          setScannedUid(result.serialNumber);
          setChipType(result.chipType);
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
        }
      );
    } catch (e: any) {
      setStatus('error');
      setStatusMessage(e?.message || 'Gagal membaca sensor NFC.');
    }
  };

  useEffect(() => {
    // Automatically trigger write readiness
    startNfcWrite();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Koneksi Kartu NFC 13.56 MHz
              </h3>
              <p className="text-[11px] text-slate-500">
                Standar HF RFID ISO/IEC 14443-A (NTAG213/215/216)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Frequency & Hardware Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="font-mono font-bold text-cyan-300">Frekuensi: 13.56 MHz</div>
              <div className="text-[10px] text-slate-300">Modulasi HF Contactless Tag</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
            {hasHardwareNfc ? 'Web NFC Ready' : 'Mode Simulator 13.56MHz'}
          </span>
        </div>

        {/* Interactive Visualizer */}
        <div className="my-5 flex flex-col items-center justify-center text-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Animated frequency ripple waves */}
            {(status === 'writing' || status === 'listening') && (
              <>
                <span className="absolute w-24 h-24 rounded-full border-2 border-blue-500/80 animate-ping" />
                <span className="absolute w-36 h-36 rounded-full border border-blue-400/60 animate-ping [animation-delay:200ms]" />
                <span className="absolute w-44 h-44 rounded-full border border-cyan-300/40 animate-ping [animation-delay:400ms]" />
              </>
            )}

            {/* Smart NFC Card Representation */}
            <div className={`w-36 aspect-[1.58/1] rounded-xl p-3 shadow-lg border flex flex-col justify-between transition-all duration-300 z-10 ${
              status === 'success'
                ? 'bg-emerald-950 border-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-700 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <Wifi className="w-4 h-4 text-cyan-400 rotate-90" />
                <span className="text-[8.5px] font-mono font-bold text-slate-300">13.56 MHz</span>
              </div>
              <div className="w-5 h-3.5 rounded bg-amber-400/90" />
              <div>
                <p className="text-[9.5px] font-bold truncate">{card.name}</p>
                <p className="text-[7.5px] font-mono text-cyan-300">UID: {scannedUid.slice(0, 11)}...</p>
              </div>
            </div>
          </div>

          {/* Status feedback */}
          <div className="mt-2 text-center">
            {status === 'success' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Kartu NFC 13.56 MHz Terkoneksi & Berhasil Ditulis</span>
              </div>
            ) : status === 'writing' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Menulis Tautan ke Chip NFC 13.56 MHz...</span>
              </div>
            ) : status === 'error' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Gagal: {statusMessage}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Siap membaca & menulis kartu NFC 13.56 MHz</div>
            )}
          </div>
        </div>

        {/* Card Technical Specs Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Frekuensi Kerja:</span>
            <span className="font-mono font-bold text-slate-900">13.56 MHz High Frequency</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Chip / Tag UID:</span>
            <span className="font-mono font-bold text-blue-700">{scannedUid}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Protokol NDEF:</span>
            <span className="font-mono text-slate-800">URI Google Review (NTAG213/215)</span>
          </div>
          <div className="pt-2 border-t border-slate-200/80">
            <span className="text-[10.5px] text-slate-500 block">Tautan yang ditulis ke chip:</span>
            <p className="font-mono text-[11px] text-slate-800 truncate mt-0.5 select-all">
              {targetUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={startNfcWrite}
            disabled={status === 'writing'}
            className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tulis ke Kartu 13.56MHz</span>
          </button>

          <button
            type="button"
            onClick={startNfcRead}
            disabled={status === 'listening'}
            className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Scan Tag 13.56MHz</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
        >
          Selesai & Simpan Konfigurasi
        </button>
      </div>
    </div>
  );
};
