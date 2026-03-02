import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  query: <T extends QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    return pool.query<T>(text, params);
  },
  getClient: () => {
    return pool.connect();
  }
};
