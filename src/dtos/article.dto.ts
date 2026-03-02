import { CreateArticleInput } from '../types';

class ArticleDTO {
  name: string;
  price: number;
  supplier_id: number;
  slug: string;
  serial_number?: string;
  country_code?: string;
  description: string;
  tags: string[];
  stock_quantity: number;
  image_url?: string;
  discounted?: boolean;
  expires_at?: Date | null;
  categories?: number[];

  constructor(data: CreateArticleInput) {
    const input = data || {} as CreateArticleInput;
    this.name = input.name;
    this.price = input.price;
    this.supplier_id = input.supplier_id;
    this.slug = input.slug || input.name?.toLowerCase().replace(/ /g, '-');
    this.serial_number = input.serial_number;
    this.country_code = input.country_code;
    this.description = input.description || '';
    this.tags = input.tags || [];
    this.stock_quantity = input.stock_quantity || 0;
    this.image_url = input.image_url;
    this.discounted = input.discounted || false;
    this.expires_at = input.expires_at || null;
    this.categories = input.categories || [];
  }
}

export default ArticleDTO;
