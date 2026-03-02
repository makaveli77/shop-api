import CategoryService from '../services/category.service';
import CategoryRepository from '../repositories/category.repository';

jest.mock('../repositories/category.repository');

const mockedCategoryRepository = CategoryRepository as jest.Mocked<typeof CategoryRepository>;

describe('CategoryService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a category', async () => {
    const mockCategory = { id: 1, name: 'Test Category', description: 'Test Description' };
    mockedCategoryRepository.save.mockResolvedValueOnce(mockCategory as any);

    const result = await CategoryService.create({ name: 'Test Category', description: 'Test Description' });

    expect(mockedCategoryRepository.save).toHaveBeenCalledWith({ name: 'Test Category', description: 'Test Description' });
    expect(result).toEqual(mockCategory);
  });

  it('should get a category by id', async () => {
    const mockCategory = { id: 1, name: 'Test Category', description: 'Test Description' };
    mockedCategoryRepository.findById.mockResolvedValueOnce(mockCategory as any);

    const result = await CategoryService.getById(1);

    expect(mockedCategoryRepository.findById).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockCategory);
  });

  it('should get all categories', async () => {
    const mockCategories = [{ id: 1, name: 'Test Category', description: 'Test Description' }];
    mockedCategoryRepository.findAll.mockResolvedValueOnce(mockCategories as any);

    const result = await CategoryService.getAll();

    expect(mockedCategoryRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockCategories);
  });

  it('should update a category', async () => {
    const mockCategory = { id: 1, name: 'Updated Category', description: 'Updated Description' };
    mockedCategoryRepository.update.mockResolvedValueOnce(mockCategory as any);

    const result = await CategoryService.update(1, { name: 'Updated Category', description: 'Updated Description' });

    expect(mockedCategoryRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Category', description: 'Updated Description' });
    expect(result).toEqual(mockCategory);
  });

  it('should delete a category', async () => {
    const mockCategory = { id: 1, name: 'Test Category', description: 'Test Description', deleted_at: new Date() };
    mockedCategoryRepository.softDelete.mockResolvedValueOnce(mockCategory as any);

    const result = await CategoryService.delete(1);

    expect(mockedCategoryRepository.softDelete).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockCategory);
  });
});
