export interface DashboardStats {
  total_orders_today: number;
  revenue_today: number;
  new_customers: number;
  avg_check: number;
}

export interface PopularProduct {
  name: string;
  sold: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RecentOrder {
  id: number;
  code?: string;
  customer_name: string;
  status: string;
  delivery_type: string;  // Добавлено поле для типа доставки
  amount: number;
  time: string;
}
export interface ActivityData {
  day: string;
  orders: number;
  value?: number;
}

export interface SourceDistribution {
  source: string;
  percent: number;
}

export interface HourlyOrder {
  hour: string;
  count: number;
}

export interface LowStockItem {
  ingredient: string;
  stock: number;
  unit: string;
  min: number;
}

export interface ActiveDelivery {
  address: string;
  eta: string;
  driver: string;
}

export interface ChartDataPoint {
  date: Date;
  day: string;
  value: number;
  displayDate: string;
}

export interface ExtendedStats {
  avg_prep_time: string;
  on_time_percent: number;
  active_orders: number;
  couriers: number;
}