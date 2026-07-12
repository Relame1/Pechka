export interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: number;
  code?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  delivery_type: string;
  status: string;
  production_status?: string;
  payment_status?: string;
  due_at: string;
  amount: number;
  comment?: string;
  source?: string;
  payment_id?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface ClientOrder extends Order { }
export interface OrdersSummary {
  total_today: number;
  new: number;
  in_progress: number;
  completed: number;
  total_amount_today: number;
}