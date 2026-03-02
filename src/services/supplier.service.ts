// Service for Supplier
import SupplierRepository from '../repositories/supplier.repository';
import CacheService from './cache.service';
import { Supplier } from '../types';

const CACHE_PREFIX = 'suppliers_';
const CACHE_TTL = 3600; // 1 hour

const SupplierService = {
  async create(supplierData: Partial<Supplier>) {
    const supplier = await SupplierRepository.save(supplierData);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return supplier;
  },
  async getById(id: number) {
    return await SupplierRepository.findById(id);
  },
  async getAll(limit: number = 10, offset: number = 0) {
    const cacheKey = `${CACHE_PREFIX}${limit}_${offset}`;
    const cached = CacheService.get<Supplier[]>(cacheKey);
    if (cached) return cached;

    const suppliers = await SupplierRepository.findAll(limit, offset);
    CacheService.set(cacheKey, suppliers, CACHE_TTL);
    return suppliers;
  },
  async update(id: number, supplierData: Partial<Supplier>) {
    const supplier = await SupplierRepository.update(id, supplierData);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return supplier;
  },
  async delete(id: number) {
    const supplier = await SupplierRepository.delete(id);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return supplier;
  }
};

export default SupplierService;
