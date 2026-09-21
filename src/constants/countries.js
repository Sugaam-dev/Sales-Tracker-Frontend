// Centralized country codes with flags, dial codes, and ISO codes
export const COUNTRY_CODES = [
  { code: '+91',  iso: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+1',   iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1',   iso: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44',  iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61',  iso: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+81',  iso: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  iso: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+55',  iso: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+7',   iso: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+27',  iso: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+971', iso: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', iso: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+65',  iso: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60',  iso: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+62',  iso: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+82',  iso: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+39',  iso: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34',  iso: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+31',  iso: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  iso: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41',  iso: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+47',  iso: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+45',  iso: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', iso: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+48',  iso: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+52',  iso: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+54',  iso: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+20',  iso: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', iso: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', iso: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+92',  iso: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', iso: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94',  iso: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', iso: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+66',  iso: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84',  iso: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+63',  iso: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+64',  iso: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
];

/**
 * Resolves any country identifier (ISO code, dial code, compound string like "US|+1" or "IN +91")
 * into the matching COUNTRY_CODES entry.
 */
export function getCountryObj(val, fallbackIso = 'IN') {
  if (!val) {
    return COUNTRY_CODES.find(c => c.iso === fallbackIso) || COUNTRY_CODES[0];
  }
  const str = String(val).trim();
  
  // 1. Exact match on compound "ISO|CODE" (e.g. "US|+1")
  let found = COUNTRY_CODES.find(c => `${c.iso}|${c.code}` === str);
  if (found) return found;

  // 2. Space separated "ISO CODE" (e.g. "US +1" or "IN +91")
  found = COUNTRY_CODES.find(c => `${c.iso} ${c.code}` === str);
  if (found) return found;

  // 3. Match on ISO code (e.g. "US", "IN", "GB")
  const upper = str.toUpperCase();
  found = COUNTRY_CODES.find(c => c.iso.toUpperCase() === upper);
  if (found) return found;

  // 4. Match on dial code (e.g. "+1", "+91", "1", "91")
  const dialCode = str.startsWith('+') ? str : `+${str}`;
  found = COUNTRY_CODES.find(c => c.code === dialCode);
  if (found) return found;

  // 5. Check if string contains dial code e.g. "+49" in arbitrary string
  const match = str.match(/\+\d+/);
  if (match) {
    found = COUNTRY_CODES.find(c => c.code === match[0]);
    if (found) return found;
  }

  return COUNTRY_CODES.find(c => c.iso === fallbackIso) || COUNTRY_CODES[0];
}

/**
 * Normalizes input country value into standardized "ISO|CODE" format.
 */
export function normalizeCountryCode(val, fallback = 'IN|+91') {
  if (!val) return fallback;
  const str = String(val).trim();
  if (str.includes('|')) return str;
  const obj = getCountryObj(str);
  return obj ? `${obj.iso}|${obj.code}` : fallback;
}
