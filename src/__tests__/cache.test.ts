import CacheService from '../services/cache.service';

describe('Cache Service', () => {
  beforeEach(() => {
    CacheService.clear();
  });

  it('should set and get a value', () => {
    CacheService.set('test_key', { data: 'test' });
    const result = CacheService.get('test_key');
    expect(result).toEqual({ data: 'test' });
  });

  it('should return undefined for non-existent key', () => {
    const result = CacheService.get('missing_key');
    expect(result).toBeUndefined();
  });

  it('should delete a specific key', () => {
    CacheService.set('test_key', 'value');
    CacheService.delete('test_key');
    expect(CacheService.get('test_key')).toBeUndefined();
  });

  it('should invalidate all stats cache', () => {
    CacheService.set('stats_1_all', 'data1');
    CacheService.set('stats_all_all', 'data2');
    CacheService.set('other_key', 'data3');

    CacheService.invalidateStats();

    expect(CacheService.get('stats_1_all')).toBeUndefined();
    expect(CacheService.get('stats_all_all')).toBeUndefined();
    expect(CacheService.get('other_key')).toBe('data3');
  });

  it('should invalidate specific stats by filters', () => {
    CacheService.set('stats_1_all', 'data1');
    CacheService.set('stats_all_all', 'data2');

    CacheService.invalidateStatsByFilters(1);

    expect(CacheService.get('stats_1_all')).toBeUndefined();
    expect(CacheService.get('stats_all_all')).toBe('data2');
  });

  it('should get cache stats', () => {
    CacheService.set('test', 'value');
    CacheService.get('test');
    const stats = CacheService.getStats();
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('keys');
  });
});
