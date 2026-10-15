import { isValidPhoneNumber, validatePhoneNumberLength, parsePhoneNumber } from 'libphonenumber-js';
import { getCountryObj } from '../constants/countries';

// Maximum national phone number digits by country ISO
const COUNTRY_MAX_DIGITS = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 10,
  DE: 12,
  FR: 10,
  JP: 10,
  CN: 11,
  BR: 11,
  RU: 10,
  ZA: 10,
  AE: 9,
  SA: 9,
  SG: 8,
  MY: 10,
  ID: 12,
  KR: 11,
  IT: 11,
  ES: 9,
  NL: 9,
  SE: 10,
  CH: 10,
  NO: 8,
  DK: 8,
  FI: 11,
  PL: 9,
  MX: 10,
  AR: 10,
  EG: 10,
  NG: 10,
  KE: 10,
  PK: 10,
  BD: 10,
  LK: 9,
  NP: 10,
  TH: 10,
  VN: 10,
  PH: 10,
  NZ: 10,
};

/**
 * Returns maximum allowed national phone number digits based on selected country.
 */
export function getMaxPhoneDigits(countryCodeOrIso) {
  const country = getCountryObj(countryCodeOrIso);
  const iso = country?.iso || 'IN';
  return COUNTRY_MAX_DIGITS[iso] || 15;
}

/**
 * Validates a phone number against the selected country's numbering rules using libphonenumber-js.
 * 
 * @param {string} phone - National digits or full phone number
 * @param {string} countryCodeOrIso - Country identifier ("US|+1", "+1", "US", "IN +91", etc.)
 * @param {boolean} [isRequired=false] - Whether the field is mandatory
 * @param {string} [customRequiredMsg] - Custom error message when required field is empty
 * @returns {{ valid: boolean, message: string, e164?: string }}
 */
export function validatePhoneNumber(phone, countryCodeOrIso, isRequired = false, customRequiredMsg = 'Phone number is required.') {
  const trimmed = (phone || '').trim();

  // 1. Empty field checks
  if (!trimmed) {
    if (isRequired) {
      return { valid: false, message: customRequiredMsg };
    }
    return { valid: true, message: '' };
  }

  // 2. Strict leading zero rule (national numbers must not start with 0 in this system)
  if (trimmed.startsWith('0')) {
    return { valid: false, message: 'Phone number must not start with 0.' };
  }

  // 3. Strict numeric characters check (optional leading + allowed)
  const cleanDigits = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  if (!cleanDigits || !/^\d+$/.test(cleanDigits)) {
    return { valid: false, message: 'Phone number must contain only numbers.' };
  }

  // 4. Resolve Country ISO
  const country = getCountryObj(countryCodeOrIso);
  const iso = country?.iso || 'IN';

  try {
    // 5. Check validity with libphonenumber-js
    const isValid = isValidPhoneNumber(trimmed, iso);
    if (!isValid) {
      return { valid: false, message: 'Invalid phone number for the selected country.' };
    }

    const parsed = parsePhoneNumber(trimmed, iso);
    return {
      valid: true,
      message: '',
      e164: parsed ? parsed.format('E.164') : undefined,
      national: parsed ? parsed.nationalNumber : trimmed,
    };
  } catch {
    return { valid: false, message: 'Invalid phone number for the selected country.' };
  }
}

/**
 * Normalizes phone number to E.164 format (e.g. +14155552671).
 */
export function normalizeToE164(phone, countryCodeOrIso) {
  if (!phone) return '';
  const country = getCountryObj(countryCodeOrIso);
  const iso = country?.iso || 'IN';
  try {
    const parsed = parsePhoneNumber(phone.trim(), iso);
    return parsed ? parsed.format('E.164') : phone;
  } catch {
    return phone;
  }
}
