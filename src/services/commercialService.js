import { API } from '../api/config';
import { authenticatedFetch } from './authService';

function formatLeadId(leadId) {
  if (!leadId) return '';
  const strId = String(leadId);
  return strId.startsWith('L-') ? strId : `L-${strId}`;
}

export const CURRENCY_RATES = {
  USD: 1.00,
  INR: 83.50,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  ZAR: 18.50,
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  SAR: 'ر.س',
  AED: 'د.إ',
  QAR: 'ر.ق',
  KWD: 'د.ك',
  BHD: '.د.ب',
  OMR: 'ر.ع',
  ZAR: 'R',
};

export const BASE_GRADE_DAILY_COSTS_USD = {
  L1: 100,
  'L1 (Junior)': 100,
  L2: 150,
  'L2 (Mid)': 150,
  L3: 200,
  'L3 (Senior)': 200,
  L4: 250,
  'L4 (Principal)': 250,
};

export function getGradeDailyCostUSD(grade) {
  if (!grade) return 100;
  const trimmed = String(grade).trim();
  if (BASE_GRADE_DAILY_COSTS_USD[trimmed] !== undefined) {
    return BASE_GRADE_DAILY_COSTS_USD[trimmed];
  }
  if (trimmed.startsWith('L4')) return 250;
  if (trimmed.startsWith('L3')) return 200;
  if (trimmed.startsWith('L2')) return 150;
  if (trimmed.startsWith('L1')) return 100;
  return 100;
}

export function convertFromUSD(valInUSD, targetCurrency) {
  const rate = CURRENCY_RATES[targetCurrency] || 1.00;
  return Math.round(Number(valInUSD || 0) * rate * 100) / 100;
}

export function convertToUSD(valInTarget, sourceCurrency) {
  const rate = CURRENCY_RATES[sourceCurrency] || 1.00;
  if (!rate || rate === 0) return Number(valInTarget || 0);
  return Number(valInTarget || 0) / rate;
}

export function convertBetweenCurrencies(amount, fromCurrency, toCurrency) {
  const amountInUSD = convertToUSD(amount, fromCurrency);
  return convertFromUSD(amountInUSD, toCurrency);
}

export async function fetchCommercial(leadId, currency = '') {
  const formattedId = formatLeadId(leadId);
  const query = currency && currency !== 'select' ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await authenticatedFetch(`${API.COMMERCIAL(formattedId)}${query}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch commercial estimation.');
  }
  return data;
}

export async function updateCommercial(leadId, payload, currency = '') {
  const formattedId = formatLeadId(leadId);
  const query = currency && currency !== 'select' ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await authenticatedFetch(`${API.COMMERCIAL(formattedId)}${query}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorDetails = data.errors ? ` (${typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors)})` : '';
    throw new Error((data.message || 'Failed to update commercial estimation.') + errorDetails);
  }
  return data;
}

export async function fetchCommercialAnalytics(leadId, currency = '') {
  const formattedId = formatLeadId(leadId);
  const query = currency && currency !== 'select' ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await authenticatedFetch(`${API.COMMERCIAL(formattedId)}/analytics${query}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch commercial analytics.');
  }
  return data;
}

