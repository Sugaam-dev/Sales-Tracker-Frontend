/**
 * Centralized API Error Normalization Utility
 * Sanitizes backend responses, status codes, and network exceptions into user-safe messages.
 */

export async function extractErrorMessage(response, defaultMsg = 'Request failed') {
  if (!response) return defaultMsg;

  let backendMsg = '';
  try {
    const data = await response.clone().json().catch(() => ({}));
    backendMsg = data.message || data.error || '';
    if (data.errors && typeof data.errors === 'string') {
      backendMsg = backendMsg ? `${backendMsg} (${data.errors})` : data.errors;
    }
  } catch {
    // Ignore JSON parsing failure
  }

  if (backendMsg) return backendMsg;

  switch (response.status) {
    case 400:
      return 'Invalid request data. Please check your inputs and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested record or endpoint was not found.';
    case 409:
      return 'A conflict occurred with existing data. Please check for duplicates.';
    case 429: {
      const retryAfter = response.headers?.get?.('Retry-After');
      return retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please wait a moment and try again.';
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return 'A server error occurred. Please try again later.';
    default:
      return defaultMsg;
  }
}

export function normalizeError(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  const msg = err.message || '';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network error') || msg.includes('Load failed')) {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }
  if (msg.includes('AbortError') || msg.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }

  return msg || fallback;
}
