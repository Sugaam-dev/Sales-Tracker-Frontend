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

export async function createActivity(leadId, payload) {
  const formattedId = String(leadId).startsWith('L-') ? leadId : `L-${leadId}`;
  const response = await authenticatedFetch(`${API.LEADS}/${formattedId}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create activity.');
  }
  return data;
}

export async function completeActivity(activityId, completed) {
  const response = await authenticatedFetch(`${API.LEADS.replace('/leads', '')}/activities/${activityId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to complete activity.');
  }
  return data;
}

export async function bulkCreateLeads(leads) {
  const response = await authenticatedFetch(`${API.LEADS}/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ leads }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = data.errors ? `: ${typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors)}` : '';
    throw new Error((data.message || 'Failed to bulk create leads.') + details);
  }
  return data;
}

export async function fetchTasks() {
  const response = await authenticatedFetch(API.TASKS);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tasks.');
  }
  return data;
}

export async function createTask(payload) {
  const response = await authenticatedFetch(API.TASKS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create task.');
  }
  return data;
}

export async function updateTaskStatus(id, completed) {
  const response = await authenticatedFetch(`${API.TASKS}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task status.');
  }
  return data;
}

export async function deleteTask(id) {
  const response = await authenticatedFetch(`${API.TASKS}/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task.');
  }
  return data;
}

export async function fetchHeatMapReport() {
  const response = await authenticatedFetch(API.HEAT_MAP);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch heat-map report.');
  }
  return data;
}

export async function fetchActivitiesFeed(queryParams = {}) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    const val = queryParams[key];
    if (val !== undefined && val !== null && val !== '' && val !== 'All' && !String(val).startsWith('All ')) {
      // Map camelCase to backend snake_case parameters if necessary
      if (key === 'dealSize') {
        params.append('deal_size', val);
      } else if (key === 'leadId') {
        params.append('lead_id', val);
      } else if (key === 'userId') {
        params.append('user_id', val);
      } else if (key === 'dueStatus') {
        params.append('due_status', val);
      } else {
        params.append(key, val);
      }
    }
  });
  const query = params.toString();
  const url = query ? `${API.ACTIVITIES}?${query}` : API.ACTIVITIES;
  const response = await authenticatedFetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch activities feed.');
  }
  return data;
}

export async function fetchDashboardSummary(queryParams = {}) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
      params.append(key, queryParams[key]);
    }
  });

  const queryString = params.toString();
  const url = queryString ? `${API.DASHBOARD_SUMMARY}?${queryString}` : API.DASHBOARD_SUMMARY;

  const response = await authenticatedFetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard summary.');
  }
  return data;
}

export async function logGlobalActivity(payload) {
  const response = await authenticatedFetch(API.ACTIVITIES, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorDetails = data.errors ? ` (${data.errors})` : '';
    throw new Error((data.message || 'Failed to log activity.') + errorDetails);
  }
  return data;
}

export async function fetchActivitiesSummary() {
  const response = await authenticatedFetch(API.ACTIVITIES_SUMMARY);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch activities summary.');
  }
  return data;
}

export async function fetchReportsAnalytics(queryParams = {}) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
      params.append(key, queryParams[key]);
    }
  });

  const queryString = params.toString();
  const url = queryString ? `${API.REPORTS_ANALYTICS}?${queryString}` : API.REPORTS_ANALYTICS;

  const response = await authenticatedFetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch reports analytics.');
  }
  return data;
}

