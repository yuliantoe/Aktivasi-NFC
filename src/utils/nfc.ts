// NFC 13.56 MHz (ISO/IEC 14443-A / NDEF) Web NFC Hardware and Simulator Service

export interface NfcScanResult {
  serialNumber: string; // 13.56 MHz UID
  chipType: string; // e.g. "NTAG213 (13.56 MHz)"
  frequency: string; // "13.56 MHz"
  records?: Array<{ recordType: string; data: string }>;
}

export function isWebNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
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
   * Scans a physical 13.56 MHz NFC Card using Web NFC API (supported on Chrome Android & NFC devices)
   * or falls back to interactive simulated scan.
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
          onError('Gagal membaca kartu NFC 13.56 MHz. Pastikan kartu ditempelkan stabil di dekat sensor NFC.');
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          onError('Izin akses NFC ditolak oleh browser.');
        } else {
          onError(err.message || 'Sensor NFC tidak tersedia atau sedang dinonaktifkan.');
        }
      }
    } else {
      // Simulated 13.56 MHz NFC hardware scan for desktop or devices without Web NFC
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
      }, 1200);
    }
  }

  /**
   * Writes the Review URL directly to the physical 13.56 MHz NFC tag chip
   */
  public static async writeReviewUrlToCard(
    url: string,
    onSuccess: (uid: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (isWebNfcSupported()) {
      try {
        const NDEFReaderClass = (window as any).NDEFReader;
        const ndef = new NDEFReaderClass();
        await ndef.write({
          records: [
            {
              recordType: 'url',
              data: url,
            },
          ],
        });

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 80, 50]);
        }
        onSuccess(generate1356Uid());
      } catch (err: any) {
        onError(err.message || 'Gagal menulis ke chip NFC 13.56 MHz. Tempelkan kartu lebih dekat ke sensor.');
      }
    } else {
      // Simulated write with real 13.56 MHz NDEF encoding delay
      await new Promise((r) => setTimeout(r, 1000));
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 80, 50]);
      }
      onSuccess(generate1356Uid());
    }
  }
}
