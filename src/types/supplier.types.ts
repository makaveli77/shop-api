export interface Supplier {
  id?: number;
  name: string;
  company_name?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: Date;
}
