import React, { useState, useEffect } from 'react';
import { CardData, ReviewStats } from './types';
import { ActivateCard } from './components/ActivateCard';
import { ActiveDashboard } from './components/ActiveDashboard';
import { CustomerRating } from './components/CustomerRating';
import { NfcTapSimulator } from './components/NfcTapSimulator';
import { NfcConnectionModal } from './components/NfcConnectionModal';
import { PinModal } from './components/PinModal';
import { SettingsModal } from './components/SettingsModal';
import { sound } from './utils/audio';
import {
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Radio,
  MapPin,
} from 'lucide-react';

export default function App() {
  const [card, setCard] = useState<CardData | null>(null);
  const [cardId, setCardId] = useState<string>('A7K2');
  const [viewMode, setViewMode] = useState<'dashboard' | 'customer'>('dashboard');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showNfcSimulator, setShowNfcSimulator] = useState(false);
  const [showNfcConnectionModal, setShowNfcConnectionModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'settings' | 'reset' | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  // Stats
  const [stats, setStats] = useState<ReviewStats>({
    totalTaps: 14,
    positiveRedirects: 11,
    negativeIntercepted: 3,
  });

  // Load from localStorage ('kartu-demo' compatibility)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kartu-demo');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.placeId || parsed.name)) {
          setCard({
            id: parsed.id || 'A7K2',
            placeId: parsed.placeId,
            name: parsed.name,
            addr: parsed.addr || 'Jl. Tebet Raya, Jakarta Selatan',
            wa: parsed.wa,
            pin: parsed.pin || '1234',
            customUrl: parsed.customUrl || (parsed.name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${parsed.name} ${parsed.addr || ''}`.trim())}` : undefined),
            colorTheme: parsed.colorTheme || 'midnight',
            createdAt: parsed.createdAt,
            nfcUid: parsed.nfcUid || '04:A8:1F:B3:2E:77:9C',
            nfcFrequency: parsed.nfcFrequency || '13.56 MHz',
            nfcChipType: parsed.nfcChipType || 'NTAG213 (13.56 MHz ISO/IEC 14443-A)',
            nfcStatus: parsed.nfcStatus || 'connected',
            lastNfcSync: parsed.lastNfcSync,
            googleMapsUrl: parsed.googleMapsUrl,
            googleMapsRating: parsed.googleMapsRating,
            googleMapsTotalReviews: parsed.googleMapsTotalReviews,
          });
        }
      }

      const storedStats = localStorage.getItem('kartu-stats');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (e) {
      console.error('Failed to parse saved card data:', e);
    }
  }, []);

  // Save changes
  const saveCard = (newCard: CardData | null) => {
    setCard(newCard);
    try {
      if (newCard) {
        localStorage.setItem('kartu-demo', JSON.stringify(newCard));
      } else {
        localStorage.removeItem('kartu-demo');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playStarPing(3);
  };

  const handleRecordReview = (stars: number) => {
    setStats((prev) => {
      const updated: ReviewStats = {
        totalTaps: prev.totalTaps + 1,
        positiveRedirects: stars >= 4 ? prev.positiveRedirects + 1 : prev.positiveRedirects,
        negativeIntercepted: stars <= 3 ? prev.negativeIntercepted + 1 : prev.negativeIntercepted,
      };
      try {
        localStorage.setItem('kartu-stats', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const handleResetConfirmed = () => {
    saveCard(null);
    setViewMode('dashboard');
    setShowPinModal(false);
  };

  const handleSettingsConfirmed = () => {
    setShowPinModal(false);
    setShowSettingsModal(true);
  };

  return (
    <div className="min-h-screen bg-[#eef2f9] text-[#0c1a33] font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#d9e0ee] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
              Kartu Ulasan
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              NFC #{card?.id || cardId}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-slate-700">
              <Radio className="w-2.5 h-2.5 text-cyan-400" />
              13.56 MHz
            </span>
          </div>

          <div className="flex items-center gap-2">
            {card && (
              <button
                onClick={() => setShowNfcConnectionModal(true)}
                className="hidden sm:flex text-xs text-slate-700 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors items-center gap-1.5 cursor-pointer"
                title="Kelola Koneksi NFC 13.56 MHz"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-500" />
                <span>NFC 13.56MHz</span>
              </button>
            )}

            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              title="Cara kerja kartu"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Cara Kerja</span>
            </button>

            <button
              onClick={handleSoundToggle}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
              title={soundEnabled ? 'Suara Aktif (Klik untuk Matikan)' : 'Suara Mati (Klik untuk Nyalakan)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Explainer Drawer / Banner */}
      {showExplainer && (
        <div className="bg-blue-600 text-white px-4 py-3.5 shadow-md">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <span>
                <strong>Bagaimana Smart Review NFC 13.56 MHz bekerja?</strong> Menggunakan standar chip ISO/IEC 14443-A (13.56 MHz). Pelanggan cukup menempelkan HP ke kartu tanpa aplikasi. Profil bisnis terhubung ke Google Maps, rating 4-5 bintang langsung ke Google Review, dan rating 1-3 bintang difilter masuk ke WhatsApp pribadi pemilik bisnis.
              </span>
            </div>
            <button
              onClick={() => setShowExplainer(false)}
              className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-md shrink-0 cursor-pointer font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[420px] w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-auto transition-all">
        {/* Card Frame */}
        <div className="bg-white border border-[#d9e0ee] rounded-[24px] p-6 shadow-sm min-h-[460px] flex flex-col justify-between transition-all">
          {!card ? (
            <ActivateCard
              cardId={cardId}
              onActivated={(activatedCard) => {
                saveCard(activatedCard);
                setViewMode('dashboard');
              }}
            />
          ) : viewMode === 'dashboard' ? (
            <ActiveDashboard
              card={card}
              stats={stats}
              onTryCustomer={() => {
                sound.playStarPing(1);
                setViewMode('customer');
              }}
              onSimulateNfc={() => setShowNfcSimulator(true)}
              onOpenNfcConnection={() => setShowNfcConnectionModal(true)}
              onOpenSettings={() => {
                setPinAction('settings');
                setShowPinModal(true);
              }}
              onResetCard={() => {
                setPinAction('reset');
                setShowPinModal(true);
              }}
            />
          ) : (
            <CustomerRating
              card={card}
              onBackToDashboard={() => setViewMode('dashboard')}
              onRecordReview={handleRecordReview}
            />
          )}
        </div>

        {/* Footer note matching original HTML */}
        <p className="text-[12.5px] text-[#5b6b86] text-center mt-4 px-2 leading-relaxed">
          Frekuensi: <strong>13.56 MHz</strong> (Standar NTAG213/215). Tersambung profil bisnis di Google Maps.
        </p>
      </main>

      {/* Modals & Overlays */}
      {showNfcSimulator && card && (
        <NfcTapSimulator
          card={card}
          onTapped={() => {
            setShowNfcSimulator(false);
            setViewMode('customer');
          }}
          onClose={() => setShowNfcSimulator(false)}
        />
      )}

      {showNfcConnectionModal && card && (
        <NfcConnectionModal
          card={card}
          onUpdateCardNfc={(nfcData) => {
            const updated = { ...card, ...nfcData };
            saveCard(updated);
          }}
          onClose={() => setShowNfcConnectionModal(false)}
        />
      )}

      {showPinModal && card && (
        <PinModal
          expectedPin={card.pin}
          title={pinAction === 'reset' ? 'PIN Reset Kartu' : 'PIN Pengaturan Kartu'}
          subtitle={
            pinAction === 'reset'
              ? 'Masukkan PIN 4 digit untuk mengosongkan data kartu.'
              : 'Masukkan PIN 4 digit untuk mengubah informasi kartu.'
          }
          onSuccess={() => {
            if (pinAction === 'reset') {
              handleResetConfirmed();
            } else {
              handleSettingsConfirmed();
            }
          }}
          onClose={() => setShowPinModal(false)}
        />
      )}

      {showSettingsModal && card && (
        <SettingsModal
          card={card}
          onSave={(updated) => saveCard(updated)}
          onReset={handleResetConfirmed}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-[#d9e0ee] text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Kartu Ulasan NFC 13.56 MHz © 2026 · Terkoneksi Google Maps Review</span>
          <span className="text-[11px] text-slate-400">ISO/IEC 14443-A & WhatsApp Empathy Filter</span>
        </div>
      </footer>
    </div>
  );
}
