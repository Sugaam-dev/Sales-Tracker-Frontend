import { API } from '../api/config';
import { authenticatedFetch } from './authService';

function formatLeadId(leadId) {
  if (!leadId) return '';
  const strId = String(leadId);
  return strId.startsWith('L-') ? strId : `L-${strId}`;
}

export const CURRENCY_RATES = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.50,
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

export const BASE_GRADE_DAILY_COSTS_USD = {
  L1: 180,
  L2: 220,
  L3: 380,
  L4: 520,
};

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

