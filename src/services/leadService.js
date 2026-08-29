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
  const formattedId = String(id).startsWith('L-') ? id : `L-${id}`;
  const response = await authenticatedFetch(`${API.LEADS}/${formattedId}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch lead details.');
  }
  return data;
}

export async function updateLead(id, payload) {
  const formattedId = String(id).startsWith('L-') ? id : `L-${id}`;
  const response = await authenticatedFetch(`${API.LEADS}/${formattedId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorDetails = data.errors ? ` (${data.errors})` : '';
    throw new Error((data.message || 'Failed to update lead.') + errorDetails);
  }
  return data;
}

export async function createLead(payload) {
  const response = await authenticatedFetch(API.LEADS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorDetails = data.errors ? ` (${data.errors})` : '';
    throw new Error((data.message || 'Failed to create lead.') + errorDetails);
  }
  return data;
}

export async function deleteLead(id) {
  const formattedId = String(id).startsWith('L-') ? id : `L-${id}`;
  const response = await authenticatedFetch(`${API.LEADS}/${formattedId}`, {
    method: 'DELETE',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete lead.');
  }
  return data;
}

export async function fetchLeadActivities(id) {
  const formattedId = String(id).startsWith('L-') ? id : `L-${id}`;
  const response = await authenticatedFetch(`${API.LEADS}/${formattedId}/activities`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch lead activities.');
  }
  return data;
}
