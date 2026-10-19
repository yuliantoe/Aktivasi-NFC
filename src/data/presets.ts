import { BusinessPreset } from '../types';

export const INDONESIAN_BUSINESS_PRESETS: BusinessPreset[] = [
  {
    name: 'Warung Kopi Pak Joko',
    addr: 'Jl. Tebet Raya No. 42, Jakarta Selatan',
    category: 'Coffee Shop & Cafe',
    rating: 4.9,
    reviews: 328,
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Warung+Kopi+Pak+Joko+Tebet+Jakarta',
  },
  {
    name: 'Kopi Kenangan Senopati',
    addr: 'Jl. Senopati No. 18, Kebayoran Baru, Jakarta Selatan',
    category: 'Cafe & Minuman',
    rating: 4.8,
    reviews: 1240,
    placeId: 'ChIJgUbEo8cfqokR5lP9_WhZeWA',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kopi+Kenangan+Senopati+Jakarta',
  },
  {
    name: 'Bakso Solo Pak Min',
    addr: 'Jl. Dipati Ukur No. 85, Lebakgede, Coblong, Bandung',
    category: 'Restoran & Kuliner',
    rating: 4.7,
    reviews: 580,
    placeId: 'ChIJ5T1_tD5tEmsRUsoyG83frM1',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bakso+Solo+Pak+Min+Dipatiukur+Bandung',
  },
  {
    name: 'Barber Shop Kang Dede',
    addr: 'Jl. Braga No. 99, Sumur Bandung, Kota Bandung',
    category: 'Barbershop & Grooming',
    rating: 4.9,
    reviews: 215,
    placeId: 'ChIJc3U_tE5tEmsRUs9yG83frM2',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Barbershop+Kang+Dede+Braga+Bandung',
  },
  {
    name: 'Klinik Gigi Senyum Sehat',
    addr: 'Jl. Raya Darmo No. 56, Wonokromo, Surabaya',
    category: 'Klinik & Kesehatan',
    rating: 4.9,
    reviews: 442,
    placeId: 'ChIJVVV_tD5tEmsRUsoyG83frS3',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Klinik+Gigi+Senyum+Sehat+Darmo+Surabaya',
  },
  {
    name: 'Salon Cantik Rina',
    addr: 'Jl. Malioboro No. 34, Sosromenduran, Yogyakarta',
    category: 'Salon & Spa Kecantikan',
    rating: 4.8,
    reviews: 196,
    placeId: 'ChIJXXX_tD5tEmsRUsoyG83frY5',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Salon+Cantik+Rina+Malioboro+Yogyakarta',
  },
  {
    name: 'Laundry Bersih Kilat',
    addr: 'Jl. Gatot Subroto No. 112, Medan Petisah, Kota Medan',
    category: 'Jasa Laundry',
    rating: 4.6,
    reviews: 147,
    placeId: 'ChIJYYY_tD5tEmsRUsoyG83frM6',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Laundry+Bersih+Kilat+Gatot+Subroto+Medan',
  },
  {
    name: 'Bengkel Motor Jaya Abadi',
    addr: 'Jl. Margonda Raya No. 201, Beji, Kota Depok',
    category: 'Otomotif & Bengkel',
    rating: 4.8,
    reviews: 310,
    placeId: 'ChIJZZZ_tD5tEmsRUsoyG83frD7',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bengkel+Motor+Jaya+Abadi+Margonda+Depok',
  },
  {
    name: 'Toko Roti Manis & Pastry',
    addr: 'Jl. Pemuda No. 78, Pandansari, Semarang Tengah',
    category: 'Bakery & Toko Roti',
    rating: 4.9,
    reviews: 412,
    placeId: 'ChIJAAA_tD5tEmsRUsoyG83frS8',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Toko+Roti+Manis+Pemuda+Semarang',
  },
  {
    name: 'Apotek Keluarga Farma',
    addr: 'Jl. Pajajaran No. 45, Baranangsiang, Kota Bogor',
    category: 'Apotek & Farmasi',
    rating: 4.7,
    reviews: 189,
    placeId: 'ChIJBBB_tD5tEmsRUsoyG83frB9',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Apotek+Keluarga+Farma+Pajajaran+Bogor',
  },
  {
    name: 'Sate Khas Senayan',
    addr: 'Jl. Pakubuwono VI No. 6, Kebayoran Baru, Jakarta Selatan',
    category: 'Restoran Nusantara',
    rating: 4.8,
    reviews: 1850,
    placeId: 'ChIJCCC_tD5tEmsRUsoyG83frK0',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sate+Khas+Senayan+Pakubuwono+Jakarta',
  },
  {
    name: 'Gym & Fitness Center Prima',
    addr: 'Jl. Ir. H. Juanda (Dago) No. 120, Kota Bandung',
    category: 'Fitness & Gym',
    rating: 4.9,
    reviews: 275,
    placeId: 'ChIJDDD_tD5tEmsRUsoyG83frP1',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gym+Fitness+Center+Prima+Dago+Bandung',
  },
];

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateGooglePlaceId(name: string): string {
  const hash = hashString(name).toString(36).toUpperCase();
  return `ChIJ_${hash}_MAPS`;
}

export function buildGoogleMapsSearchUrl(name: string, addr?: string): string {
  const q = `${name.trim()} ${addr?.trim() || ''}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function normalizeWhatsApp(r?: string): string | null {
  if (!r) return null;
  let n = String(r).replace(/\D/g, '');
  if (n.startsWith('0')) {
    n = '62' + n.slice(1);
  } else if (n.startsWith('8')) {
    n = '62' + n;
  }
  return /^\d{9,15}$/.test(n) ? n : null;
}

export function formatWhatsAppDisplay(n: string): string {
  if (!n) return '';
  if (n.startsWith('62')) {
    const rest = n.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return `+${n}`;
}

export function getGoogleReviewUrl(placeId: string, customUrl?: string): string {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl.trim();
  }
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
