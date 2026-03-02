import { db } from '../config/db';
import { Supplier } from '../types';
import SupplierQueries from '../queries/supplier.queries';

const SupplierRepository = {
  async save(supplierData: Partial<Supplier>): Promise<Supplier> {
    const { rows } = await db.query<Supplier>(
      SupplierQueries.save,
      [supplierData.name, supplierData.company_name, supplierData.city, supplierData.latitude, supplierData.longitude, supplierData.created_at || new Date()]
    );
    return rows[0];
  },
  async findById(id: number): Promise<Supplier | undefined> {
    const { rows } = await db.query<Supplier>(SupplierQueries.findById, [id]);
    return rows[0];
  },
  async findAll(limit: number = 10, offset: number = 0): Promise<Supplier[]> {
    const { rows } = await db.query<Supplier>(SupplierQueries.findAll, [limit, offset]);
    return rows;
  },
  async update(id: number, supplierData: Partial<Supplier>): Promise<Supplier | undefined> {
    const { rows } = await db.query<Supplier>(
      SupplierQueries.update,
      [supplierData.name, supplierData.company_name, supplierData.city, supplierData.latitude, supplierData.longitude, id]
    );
    return rows[0];
  },
  async delete(id: number): Promise<Supplier | undefined> {
    const { rows } = await db.query<Supplier>(SupplierQueries.delete, [id]);
    return rows[0];
  }
};

export default SupplierRepository;
