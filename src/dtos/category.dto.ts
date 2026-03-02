// DTO for Category
import { Category } from '../types';

class CategoryDTO implements Category {
  id?: number;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;

  constructor(data: Partial<Category>) {
    this.id = data.id;
    this.name = data.name || '';
    this.description = data.description || '';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.deleted_at = data.deleted_at || null;
  }
}

export default CategoryDTO;
