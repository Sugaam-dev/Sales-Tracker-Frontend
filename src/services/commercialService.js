import { API } from '../api/config';
import { authenticatedFetch } from './authService';

function formatLeadId(leadId) {
  if (!leadId) return '';
  const strId = String(leadId);
  return strId.startsWith('L-') ? strId : `L-${strId}`;
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
