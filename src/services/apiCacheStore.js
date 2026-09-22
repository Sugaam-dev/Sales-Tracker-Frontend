// Centralized In-Flight Request Deduplicator
// Coalesces identical concurrent in-flight asynchronous operations without persisting completed responses.

class ApiCacheStore {
  constructor() {
    this.inflightPromises = new Map();
  }

  /**
   * Generates a deterministic key based on endpoint, params, and scope.
   */
  generateKey(endpoint, params = {}, scope = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    const userScope = scope.userId ? `:${scope.userId}:${scope.role || 'user'}` : '';
    return sortedParams ? `${endpoint}${userScope}?${sortedParams}` : `${endpoint}${userScope}`;
  }

  /**
   * Executes fetcherFn with in-flight deduplication.
   * If an identical key is already pending, returns the existing promise.
   * Immediately clears the promise upon settlement (resolved or rejected).
   * Does NOT store completed responses or use TTL.
   */
  async fetchWithCache(key, fetcherFn) {
    if (this.inflightPromises.has(key)) {
      return this.inflightPromises.get(key);
    }

    const promise = (async () => {
      try {
        return await fetcherFn();
      } finally {
        this.inflightPromises.delete(key);
      }
    })();

    this.inflightPromises.set(key, promise);
    return promise;
  }

  /**
   * Invalidation / clear helpers maintained for API compatibility (safe no-ops since no completed response cache exists).
   */
  invalidatePattern(pattern) {
    for (const key of this.inflightPromises.keys()) {
      if (key.includes(pattern)) {
        this.inflightPromises.delete(key);
      }
    }
  }

  clear() {
    this.inflightPromises.clear();
  }
}

export const apiCacheStore = new ApiCacheStore();
