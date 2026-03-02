/**
 * Cache Service
 * Centralized cache management with smart invalidation patterns
 */

import cache from '../config/cache';

const CacheService = {
  // Get value from cache
  get<T = any>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  // Set value in cache with optional TTL
  set<T = any>(key: string, value: T, ttl: number = 600): boolean {
    return cache.set(key, value, ttl);
  },

  // Delete specific key
  delete(key: string): number {
    return cache.del(key);
  },

  // Invalidate all stats cache (for write operations)
  invalidateStats(): void {
    const keys = cache.keys();
    const statsKeys = keys.filter(k => k.startsWith('stats_'));
    if (statsKeys.length > 0) {
      cache.del(statsKeys);
    }
  },

  // Invalidate specific stat by filters
  invalidateStatsByFilters(shop_id?: number, city?: string): void {
    const key = `stats_${shop_id || 'all'}_${city || 'all'}`;
    cache.del(key);
  },

  // Invalidate all keys starting with a specific prefix
  invalidatePrefix(prefix: string): void {
    const keys = cache.keys();
    const matchingKeys = keys.filter(k => k.startsWith(prefix));
    if (matchingKeys.length > 0) {
      cache.del(matchingKeys);
    }
  },

  // Clear entire cache
  clear(): void {
    cache.flushAll();
  },

  // Get cache stats
  getStats() {
    return cache.getStats();
  }
};

export default CacheService;
