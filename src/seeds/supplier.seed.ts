import { faker } from '@faker-js/faker';
import SeedQueries from '../queries/seed.queries';
import { db } from '../config/db';
import { DatabaseQueryResult } from '../types';

interface Supplier {
  id: number;
  name: string;
  company_name: string;
  city: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const seedSuppliers = async (database = db): Promise<DatabaseQueryResult<Supplier>> => {
  console.log('🌱 Seeding suppliers...');
  
  try {
    const suppliers: Omit<Supplier, 'id' | 'created_at'>[] = [];
    const cities = [
      'Mostar', 'Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica',
      'Travnik', 'Srebrenica', 'Konjic', 'Gradačac', 'Čapljina',
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'London', 'Paris', 'Berlin', 'Madrid', 'Amsterdam',
      'Istanbul', 'Athens', 'Rome', 'Barcelona', 'Vienna',
      'Tokyo', 'Seoul', 'Bangkok', 'Singapore', 'Hong Kong',
      'Sydney', 'Auckland', 'Toronto', 'Vancouver', 'Mexico City',
      'São Paulo', 'Buenos Aires', 'Dubai', 'Cairo', 'Johannesburg'
    ];
    
    // Generate 50 suppliers
    for (let i = 0; i < 50; i++) {
      const city = cities[i % cities.length];
      suppliers.push({
        name: `${faker.company.name()} Supplier ${i + 1}`,
        company_name: faker.company.name(),
        city: city,
        latitude: parseFloat(faker.location.latitude({ min: -90, max: 90 }).toString()),
        longitude: parseFloat(faker.location.longitude({ min: -180, max: 180 }).toString())
      });
    }
    
    // Build bulk insert query
    const values: (string | number)[] = [];
    const placeholders = suppliers
      .map((supplier, i) => {
        const offset = i * 5;
        values.push(supplier.name, supplier.company_name, supplier.city, supplier.latitude, supplier.longitude);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      })
      .join(',');
    
    const sql = SeedQueries.insertSuppliers(placeholders);
    
    const result = await database.query<Supplier>(sql, values);
    console.log(`✅ ${suppliers.length} suppliers seeded`);
    return result;
  } catch (err) {
    console.error('❌ Supplier seeding failed:', err);
    throw err;
  }
};

export default seedSuppliers;
