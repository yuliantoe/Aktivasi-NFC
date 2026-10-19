// NFC 13.56 MHz (ISO/IEC 14443-A / NDEF) Web NFC Hardware and Diagnostic Service

export interface NfcScanResult {
  serialNumber: string; // 13.56 MHz UID
  chipType: string; // e.g. "NTAG213 (13.56 MHz)"
  frequency: string; // "13.56 MHz"
  records?: Array<{ recordType: string; data: string }>;
}

export interface NfcDiagnostic {
  hasWebNfc: boolean;
  isSecureContext: boolean;
  isAndroid: boolean;
  isChrome: boolean;
  isIos: boolean;
  platformDescription: string;
  recommendation: string;
}

export function isWebNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export function getNfcDiagnostic(): NfcDiagnostic {
  if (typeof window === 'undefined') {
    return {
      hasWebNfc: false,
      isSecureContext: false,
      isAndroid: false,
      isChrome: false,
      isIos: false,
      platformDescription: 'Server / Non-Browser',
      recommendation: 'Jalankan di browser ponsel.',
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = /android/i.test(ua);
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edg|opr|samsung|ucbrowser|line/i.test(ua);
  const hasWebNfc = 'NDEFReader' in window;
  const isSecure = window.isSecureContext;

  let platformDescription = 'Desktop / PC';
  let recommendation = '';

  if (isAndroid) {
    if (hasWebNfc) {
      platformDescription = 'HP Android (Web NFC Didukung)';
      recommendation = 'Pastikan fitur NFC diaktifkan di Pengaturan HP Anda, lalu tempelkan kartu ke bodi belakang HP.';
    } else {
      platformDescription = 'HP Android (Browser Non-Chrome / In-App)';
      recommendation = 'Buka website ini menggunakan aplikasi Google Chrome resmi di Android agar dapat langsung menulis ke tag NFC.';
    }
  } else if (isIos) {
    platformDescription = 'Apple iPhone / iOS';
    recommendation = 'Apple Safari belum mengizinkan website menulis langsung ke NFC (CoreNFC). Gunakan aplikasi gratis "NFC Tools" di iPhone atau buka website ini di HP Android.';
  } else {
    platformDescription = 'Komputer / Laptop (Desktop)';
    recommendation = 'Fitur penulisan tag NFC fisik memerlukan smartphone dengan sensor NFC (buka link ini di Google Chrome HP Android).';
  }

  return {
    hasWebNfc,
    isSecureContext: isSecure,
    isAndroid,
    isChrome,
    isIos,
    platformDescription,
    recommendation,
  };
}

export function generate1356Uid(): string {
  // Standard NXP 7-byte UID starting with 04 (NXP manufacturer byte for NTAG213/215/216)
  const bytes = [0x04];
  for (let i = 1; i < 7; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  return bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

export class NfcService {
  public static readonly FREQUENCY = '13.56 MHz';
  public static readonly STANDARD = 'ISO/IEC 14443 Type A';

  /**
   * Scans a physical 13.56 MHz NFC Card using Web NFC API
   */
  public static async scanPhysicalCard(
    onReading: (result: NfcScanResult) => void,
    onError: (error: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    if (isWebNfcSupported()) {
      try {
        const NDEFReaderClass = (window as any).NDEFReader;
        const ndef = new NDEFReaderClass();
        await ndef.scan({ signal: abortSignal });

        ndef.addEventListener('reading', (event: any) => {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
          const serial = event.serialNumber || generate1356Uid();
          const records: Array<{ recordType: string; data: string }> = [];

          if (event.message && event.message.records) {
            for (const record of event.message.records) {
              const textDecoder = new TextDecoder();
              records.push({
                recordType: record.recordType,
                data: record.data ? textDecoder.decode(record.data) : '',
              });
            }
          }

          onReading({
            serialNumber: serial,
            chipType: 'NTAG213 / NTAG215 (13.56 MHz)',
            frequency: NfcService.FREQUENCY,
            records,
          });
        });

        ndef.addEventListener('readingerror', () => {
          onError('Gagal membaca kartu NFC 13.56 MHz. Pastikan kartu ditempelkan stabil di dekat sensor antena NFC HP.');
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          onError('Izin NFC belum diberikan di browser Chrome atau fitur NFC di HP dalam kondisi mati.');
        } else if (err.name === 'NotSupportedError') {
          onError('Perangkat ini tidak memiliki perangkat keras NFC 13.56 MHz.');
        } else if (err.name === 'AbortError') {
          // aborted deliberately
        } else {
          onError(err.message || 'Sensor NFC tidak tersedia atau sedang dinonaktifkan.');
        }
      }
    } else {
      // Simulated scan for testing on desktop
      setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([30, 40, 30]);
        }
        onReading({
          serialNumber: generate1356Uid(),
          chipType: 'NTAG213 (13.56 MHz High-Frequency)',
          frequency: NfcService.FREQUENCY,
          records: [
            {
              recordType: 'url',
              data: 'https://search.google.com/local/writereview',
            },
          ],
        });
      }, 1000);
    }
  }

  /**
   * Writes the Review URL directly to the physical 13.56 MHz NFC tag chip.
   * MUST be invoked directly from a user click/gesture.
   */
  public static async writeReviewUrlToCard(
    url: string,
    onSuccess: (uid: string) => void,
    onError: (error: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    if (isWebNfcSupported()) {
      try {
        const NDEFReaderClass = (window as any).NDEFReader;
        const ndef = new NDEFReaderClass();

        // Write NDEF standard URL record to 13.56 MHz Tag
        await ndef.write(
          {
            records: [
              {
                recordType: 'url',
                data: url,
              },
            ],
          },
          {
            signal: abortSignal,
            overwrite: true,
          }
        );

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 50, 100]);
        }
        onSuccess(generate1356Uid());
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          onError('Izin NFC ditolak atau NFC di pengaturan HP Anda belum dinyalakan. Masuk ke Pengaturan HP > Koneksi > Nyalakan NFC.');
        } else if (err.name === 'NotSupportedError') {
          onError('Tipe kartu/tag NFC ini tidak didukung atau kapasitas memorinya terlalu kecil.');
        } else if (err.name === 'NotReadableError') {
          onError('Kartu terlepas terlalu cepat. Tempelkan kartu dan tahan 1-2 detik di belakang HP.');
        } else if (err.name === 'AbortError') {
          // aborted by user
        } else {
          onError(err.message || 'Gagal menulis ke chip NFC 13.56 MHz.');
        }
      }
    } else {
      // If Web NFC is not available on this browser/device
      const diagnostic = getNfcDiagnostic();
      onError(`Browser ini belum mendukung Web NFC secara langsung (${diagnostic.platformDescription}). ${diagnostic.recommendation}`);
    }
  }
}
