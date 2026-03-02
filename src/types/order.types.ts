export interface OrderItemInput {
  article_id: number;
  quantity: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  article_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
}
