import { API } from '../api/config';
import { authenticatedFetch } from './authService';

export async function fetchCurrentUsers() {
  const response = await authenticatedFetch(API.CURRENT_USERS);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch current users.');
  }
  return data;
}

export async function fetchMasterStages() {
  const response = await authenticatedFetch(API.MASTER_STAGES);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch master stages.');
  }
  return data;
}

export async function fetchLeads(queryParams = {}) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
      params.append(key, queryParams[key]);
    }
  });

  const queryString = params.toString();
  const url = queryString ? `${API.LEADS}?${queryString}` : API.LEADS;

  const response = await authenticatedFetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch leads.');
  }
  return data;
}

export async function fetchLeadById(id) {
  const response = await authenticatedFetch(`${API.LEADS}/${id}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch lead details.');
  }
  return data;
}

export async function updateLead(id, payload) {
  const response = await authenticatedFetch(`${API.LEADS}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update lead.');
  }
  return data;
}
