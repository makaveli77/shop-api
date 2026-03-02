export interface Article {
  id: number;
  supplier_id: number;
  name: string;
  slug: string;
  serial_number: string | null;
  country_code: string | null;
  price: number;
  stock_quantity: number;
  description: string | null;
  tags: string[];
  image_url: string | null;
  discounted: boolean;
  discounted_price?: number;
  expires_at: Date | null;
  created_at: Date;
  deleted_at: Date | null;
  categories?: number[];
}

export interface ArticleDiscount {
  id: number;
  article_id: number;
  supplier_id: number;
  category_id: number;
  discounted_price: number;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateArticleDiscountPayload {
  article_id: number;
  discounted_price: number;
  expires_at?: Date | null;
}

export interface CreateArticleDiscountInput extends CreateArticleDiscountPayload {
  supplier_id: number;
  category_id: number;
}

export interface CreateArticleInput {
  name: string;
  slug?: string;
  supplier_id: number;
  serial_number?: string;
  country_code?: string;
  price: number;
  stock_quantity?: number;
  description?: string;
  tags?: string[];
  image_url?: string;
  discounted?: boolean;
  expires_at?: Date | null;
  categories?: number[];
}

export interface UpdateArticleInput {
  name?: string;
  price?: number;
  stock_quantity?: number;
  description?: string;
  tags?: string[];
  discounted?: boolean;
  expires_at?: Date | null;
  categories?: number[];
  type_id?: number;
}

export interface ArticleFilters {
  name?: string;
  description?: string;
  tags?: string | string[];
  supplier_id?: number;
  category_id?: number;
  min_price?: number;
  max_price?: number;
}

export interface StatsFilters {
  supplier_id?: number;
  city?: string;
}

export interface ArticleStats {
  total_articles: string;
  total_stock: string | null;
  total_inventory_value: string | null;
  average_price: string | null;
  cheapest_article?: string | null;
  most_expensive_article?: string | null;
}

export interface StatsResponse {
  status: string;
  source: string;
  filters: StatsFilters;
  data: {
    total_products: number;
    total_stock: number;
    total_inventory_value: string;
    average_price: string;
    extremes: {
      min: string;
      max: string;
    };
  };
}
