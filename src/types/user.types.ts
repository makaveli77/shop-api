export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone_number?: string;
  date_of_birth?: string | Date;
  city?: string;
  country_code?: string;
  ip_address?: string;
  is_locked: boolean;
  registration_date: Date;
  last_login?: Date | null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone_number?: string;
  date_of_birth?: string;
  city?: string;
  country_code?: string;
  ip_address?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  address?: string;
  phone_number?: string;
  date_of_birth?: string | Date;
  city?: string;
  country_code?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface JWTPayload {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
}

export interface UserStats {
  balance: number;
  currency: string;
  total_deposited: number;
  total_withdrawn: number;
  total_spent: number;
  recent_transactions: {
    id: number;
    type: string;
    amount: number;
    reference_id?: number | null;
    external_reference_id?: string | null;
    description: string;
    date: Date;
  }[];
}
