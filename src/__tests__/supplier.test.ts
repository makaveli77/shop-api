import SupplierService from '../services/supplier.service';
import SupplierRepository from '../repositories/supplier.repository';

jest.mock('../repositories/supplier.repository');

const mockedSupplierRepository = SupplierRepository as jest.Mocked<typeof SupplierRepository>;

describe('SupplierService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a supplier', async () => {
    const mockSupplier = { id: 1, name: 'Test Supplier', company_name: 'Test Company', city: 'Test City', latitude: 0, longitude: 0 };
    mockedSupplierRepository.save.mockResolvedValueOnce(mockSupplier as any);

    const result = await SupplierService.create({ name: 'Test Supplier', company_name: 'Test Company', city: 'Test City', latitude: 0, longitude: 0 });

    expect(mockedSupplierRepository.save).toHaveBeenCalledWith({ name: 'Test Supplier', company_name: 'Test Company', city: 'Test City', latitude: 0, longitude: 0 });
    expect(result).toEqual(mockSupplier);
  });

  it('should get a supplier by id', async () => {
    const mockSupplier = { id: 1, name: 'Test Supplier', company_name: 'Test Company', city: 'Test City', latitude: 0, longitude: 0 };
    mockedSupplierRepository.findById.mockResolvedValueOnce(mockSupplier as any);

    const result = await SupplierService.getById(1);

    expect(mockedSupplierRepository.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockSupplier);
  });

  it('should get all suppliers', async () => {
    const mockSuppliers = [{ id: 1, name: 'Test Supplier', company_name: 'Test Company', city: 'Test City', latitude: 0, longitude: 0 }];
    mockedSupplierRepository.findAll.mockResolvedValueOnce(mockSuppliers as any);

    const result = await SupplierService.getAll();

    expect(mockedSupplierRepository.findAll).toHaveBeenCalledWith(10, 0);
    expect(result).toEqual(mockSuppliers);
  });

  it('should update a supplier', async () => {
    const mockSupplier = { id: 1, name: 'Updated Supplier', company_name: 'Updated Company', city: 'Updated City', latitude: 1, longitude: 1 };
    mockedSupplierRepository.update.mockResolvedValueOnce(mockSupplier as any);

    const result = await SupplierService.update(1, { name: 'Updated Supplier', company_name: 'Updated Company', city: 'Updated City', latitude: 1, longitude: 1 });

    expect(mockedSupplierRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Supplier', company_name: 'Updated Company', city: 'Updated City', latitude: 1, longitude: 1 });
    expect(result).toEqual(mockSupplier);
  });

  it('should delete a supplier', async () => {
    const mockSupplier = { id: 1, name: 'Test Supplier', company_name: 'Test Company', city: 'Test City', latitude: 0, longitude: 0 };
    mockedSupplierRepository.delete.mockResolvedValueOnce(mockSupplier as any);

    const result = await SupplierService.delete(1);

    expect(mockedSupplierRepository.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockSupplier);
  });
});
