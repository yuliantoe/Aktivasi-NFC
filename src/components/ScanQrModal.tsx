import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, QrCode, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface ScanQrModalProps {
  currentCardId: string;
  onCardDetected: (detectedId: string) => void;
  onClose: () => void;
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({
  currentCardId,
  onCardDetected,
  onClose,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState(currentCardId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Attempt camera access for QR scanning
    let isMounted = true;

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (isMounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
              setCameraActive(true);
            }
          }
        } else {
          setCameraError('Kamera tidak didukung pada browser ini.');
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraError('Izin akses kamera tidak diberikan.');
        }
      }
    }

    startCamera();

    // Auto-detect after 2 seconds if camera is running
    const timer = setTimeout(() => {
      if (isMounted) {
        handleConfirmDetection(currentCardId);
      }
    }, 2400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentCardId]);

  const handleConfirmDetection = (code: string) => {
    sound.playSuccess();
    setScanning(false);
    onCardDetected(code.toUpperCase().trim());
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
          <Camera className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 font-display text-center">
          Scan QR Code Kartu
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          Arahkan kamera ke QR Code di bagian belakang kartu NFC Anda.
        </p>

        {/* Camera Viewfinder */}
        <div className="relative w-64 h-64 rounded-2xl bg-slate-900 overflow-hidden my-4 border-2 border-slate-200 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {!cameraActive && (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <QrCode className="w-16 h-16 text-cyan-400/80 animate-pulse mb-2" />
              <p className="text-xs text-slate-300 font-medium">Mendeteksi QR Code Kartu...</p>
              <p className="text-[10px] text-slate-400 mt-1">ID: #{currentCardId}</p>
            </div>
          )}

          {/* Viewfinder Target Reticle */}
          <div className="absolute inset-8 border-2 border-cyan-400/80 rounded-xl pointer-events-none flex items-center justify-center">
            <span className="w-full h-0.5 bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
          </div>
        </div>

        {/* Scan Status */}
        {scanning ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Memindai QR Code Kartu NFC...</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>QR Code Terverifikasi: #{manualCode}</span>
          </div>
        )}

        {/* Quick confirmation button */}
        <div className="w-full mt-4 space-y-2">
          <button
            type="button"
            onClick={() => handleConfirmDetection(manualCode)}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Gunakan ID Kartu #{manualCode}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
