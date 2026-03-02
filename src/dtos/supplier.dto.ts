import { Supplier } from '../types';

class SupplierDTO implements Supplier {
  id?: number;
  name: string;
  company_name: string;
  city: string;
  latitude: number;
  longitude: number;
  created_at?: Date;

  constructor(data: Partial<Supplier>) {
    this.id = data.id;
    this.name = data.name || '';
    this.company_name = data.company_name || '';
    this.city = data.city || '';
    this.latitude = data.latitude || 0;
    this.longitude = data.longitude || 0;
    this.created_at = data.created_at;
  }
}

export default SupplierDTO;
