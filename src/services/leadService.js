import { API } from '../api/config';
import { authenticatedFetch } from './authService';
import { apiCacheStore } from './apiCacheStore';

export async function fetchCurrentUsers(bypassCache = false) {
  const cacheKey = 'master_current_users';
  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const response = await authenticatedFetch(API.CURRENT_USERS);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch current users.');
      }
      return data;
    },
    { ttlMs: 15 * 60 * 1000, bypassCache } // 15 minutes TTL
  );
}

export async function fetchMasterStages(bypassCache = false) {
  const cacheKey = 'master_stages';
  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const response = await authenticatedFetch(API.MASTER_STAGES);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch master stages.');
      }
      return data;
    },
    { ttlMs: 30 * 60 * 1000, bypassCache } // 30 minutes TTL
  );
}

export async function fetchLeads(queryParams = {}, bypassCache = false) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
      params.append(key, queryParams[key]);
    }
  });

  const queryString = params.toString();
  const cacheKey = `leads?${queryString}`;

  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const url = queryString ? `${API.LEADS}?${queryString}` : API.LEADS;
      const response = await authenticatedFetch(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch leads.');
      }
      return data;
    },
    { ttlMs: 2 * 60 * 1000, bypassCache }
  );
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
  // Invalidate cached leads list, analytics & dashboard
  apiCacheStore.invalidatePattern('leads');
  apiCacheStore.invalidatePattern('dashboard_summary');
  apiCacheStore.invalidatePattern('reports_analytics');
  apiCacheStore.invalidatePattern('heat_map');
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
  // Invalidate cached leads list, analytics & dashboard
  apiCacheStore.invalidatePattern('leads');
  apiCacheStore.invalidatePattern('dashboard_summary');
  apiCacheStore.invalidatePattern('reports_analytics');
  apiCacheStore.invalidatePattern('heat_map');
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
  // Invalidate cached leads list, analytics & dashboard
  apiCacheStore.invalidatePattern('leads');
  apiCacheStore.invalidatePattern('dashboard_summary');
  apiCacheStore.invalidatePattern('reports_analytics');
  apiCacheStore.invalidatePattern('heat_map');
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

export async function createLeadActivity(id, payload) {
  const formattedId = String(id).startsWith('L-') ? id : `L-${id}`;
  const response = await authenticatedFetch(`${API.LEADS}/${formattedId}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorDetails = data.errors ? ` (${data.errors})` : '';
    throw new Error((data.message || 'Failed to add activity.') + errorDetails);
  }
  apiCacheStore.invalidatePattern('activities');
  apiCacheStore.invalidatePattern('dashboard_summary');
  return data;
}

export const createActivity = createLeadActivity;

export async function updateActivityStatus(id, completed) {
  const response = await authenticatedFetch(`${API.ACTIVITIES}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update activity status.');
  }
  apiCacheStore.invalidatePattern('activities');
  apiCacheStore.invalidatePattern('dashboard_summary');
  return data;
}

export const completeActivity = updateActivityStatus;

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
    throw new Error(data.message || 'Failed to bulk import leads.');
  }
  apiCacheStore.invalidatePattern('dashboard_summary');
  apiCacheStore.invalidatePattern('reports_analytics');
  apiCacheStore.invalidatePattern('heat_map');
  return data;
}

export async function extractDocumentLeads(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authenticatedFetch(API.IMPORT_DOCUMENT, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to extract leads from document.');
  }
  return data;
}

export async function fetchTasks(bypassCache = false) {
  const cacheKey = 'user_tasks';
  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const response = await authenticatedFetch(API.TASKS);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tasks.');
      }
      return data;
    },
    { ttlMs: 2 * 60 * 1000, bypassCache }
  );
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
    const errorDetails = data.errors ? ` (${data.errors})` : '';
    throw new Error((data.message || 'Failed to create task.') + errorDetails);
  }
  apiCacheStore.invalidatePattern('user_tasks');
  return data;
}

export async function updateTaskStatus(id, completed) {
  const response = await authenticatedFetch(`${API.TASKS}/${id}`, {
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
  apiCacheStore.invalidatePattern('user_tasks');
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
  apiCacheStore.invalidatePattern('user_tasks');
  return data;
}

export async function fetchHeatMapReport() {
  const cacheKey = 'heat_map_report';
  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const response = await authenticatedFetch(API.HEAT_MAP);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch heat-map report.');
      }
      return data;
    },
    { ttlMs: 5 * 60 * 1000 }
  );
}

export async function fetchActivitiesFeed(queryParams = {}, bypassCache = false) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    const val = queryParams[key];
    if (val !== undefined && val !== null && val !== '' && val !== 'All' && !String(val).startsWith('All ')) {
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
  const cacheKey = `activities_feed?${query}`;

  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const url = query ? `${API.ACTIVITIES}?${query}` : API.ACTIVITIES;
      const response = await authenticatedFetch(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activities feed.');
      }
      return data;
    },
    { ttlMs: 2 * 60 * 1000, bypassCache }
  );
}

export async function fetchDashboardSummary(queryParams = {}, bypassCache = false, onBackgroundUpdate = null) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
      params.append(key, queryParams[key]);
    }
  });

  const queryString = params.toString();
  const cacheKey = `dashboard_summary?${queryString}`;

  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const url = queryString ? `${API.DASHBOARD_SUMMARY}?${queryString}` : API.DASHBOARD_SUMMARY;
      const response = await authenticatedFetch(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard summary.');
      }
      return data;
    },
    { ttlMs: 2 * 60 * 1000, bypassCache, onBackgroundUpdate }
  );
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
  apiCacheStore.invalidatePattern('activities');
  apiCacheStore.invalidatePattern('dashboard_summary');
  return data;
}

export async function fetchActivitiesSummary(bypassCache = false) {
  const cacheKey = 'activities_summary';

  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const response = await authenticatedFetch(API.ACTIVITIES_SUMMARY);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch activities summary.');
      }
      return data;
    },
    { ttlMs: 2 * 60 * 1000, bypassCache }
  );
}

export async function fetchReportsAnalytics(queryParams = {}, bypassCache = false, onBackgroundUpdate = null) {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
      params.append(key, queryParams[key]);
    }
  });

  const queryString = params.toString();
  const cacheKey = `reports_analytics?${queryString}`;

  return apiCacheStore.fetchWithCache(
    cacheKey,
    async () => {
      const url = queryString ? `${API.REPORTS_ANALYTICS}?${queryString}` : API.REPORTS_ANALYTICS;
      const response = await authenticatedFetch(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch reports analytics.');
      }
      return data;
    },
    { ttlMs: 5 * 60 * 1000, bypassCache, onBackgroundUpdate }
  );
}
