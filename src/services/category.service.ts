// Service for Category
import CategoryRepository from '../repositories/category.repository';
import CacheService from './cache.service';
import { Category } from '../types';

const CACHE_PREFIX = 'categories_';
const CACHE_TTL = 3600; // 1 hour

const CategoryService = {
  async create(categoryData: Partial<Category>) {
    const category = await CategoryRepository.save(categoryData);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return category;
  },
  async getById(id: number) {
    return await CategoryRepository.findById(id);
  },
  async getAll() {
    const cacheKey = `${CACHE_PREFIX}all`;
    const cached = CacheService.get<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = await CategoryRepository.findAll();
    CacheService.set(cacheKey, categories, CACHE_TTL);
    return categories;
  },
  async update(id: number, categoryData: Partial<Category>) {
    const category = await CategoryRepository.update(id, categoryData);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return category;
  },
  async delete(id: number) {
    const category = await CategoryRepository.softDelete(id);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return category;
  }
};

export default CategoryService;
