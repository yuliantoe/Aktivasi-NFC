export interface CardData {
  id: string; // e.g. "A7K2"
  placeId: string; // e.g. "ChIJgUbEo8cfqokR5lP9_WhZeWA" or "DEMO_1289381"
  name: string; // e.g. "Warung Kopi Pak Joko"
  addr?: string; // e.g. "Jl. Tebet Raya, Jakarta Selatan"
  wa: string; // e.g. "628123456789"
  pin: string; // 4 digits e.g. "1234"
  customUrl?: string; // optional direct URL override
  colorTheme?: 'midnight' | 'white' | 'navy' | 'emerald';
  createdAt?: string;
  // NFC 13.56 MHz metadata
  nfcUid?: string; // e.g. "04:5B:3A:9C:12:80" (UID Tag 13.56 MHz)
  nfcFrequency?: string; // "13.56 MHz"
  nfcChipType?: string; // "NTAG213 (13.56 MHz)" | "NTAG215" | "NTAG216" | "Mifare Classic"
  nfcStatus?: 'connected' | 'written' | 'standby';
  lastNfcSync?: string;
  // Google Maps connection
  googleMapsUrl?: string; // direct Google Maps business location URL
  googleMapsRating?: number; // e.g. 4.9
  googleMapsTotalReviews?: number; // e.g. 184
}

export interface ReviewStats {
  totalTaps: number;
  positiveRedirects: number; // 4-5 stars sent to Google
  negativeIntercepted: number; // 1-3 stars sent to WhatsApp
}

export interface BusinessPreset {
  name: string;
  addr: string;
  category: string;
  rating?: number;
  reviews?: number;
  placeId?: string;
  googleMapsUrl?: string;
}
