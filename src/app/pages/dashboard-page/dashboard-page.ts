import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../data/services/order.service';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { IngredientService, Ingredient } from '../../data/services/ingredient.service';
import {
  DashboardStats,
  PopularProduct,
  RecentOrder
} from '../../data/interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class DashboardPage implements OnInit, AfterViewInit {
  @ViewChild('lineChartContainer') lineChartContainer!: ElementRef;
  
  stats: DashboardStats | null = null;
  popular: PopularProduct[] = [];
  recentOrders: RecentOrder[] = [];
  loading = true;
  today = new Date();

  extendedStats = {
    avg_prep_time: '—',
    on_time_percent: 0,
    active_orders: 0,
    couriers: 0
  };
  chartData: { date: Date; day: string; value: number; displayDate: string }[] = [];
  filteredChartData: { date: Date; day: string; value: number; displayDate: string }[] = [];
  maxSalesValue = 1;
  zoomLevel = 7;
  zoomMin = 1;
  zoomMax = 90;
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipData: { displayDate: string; value: number } | null = null;
  
  sourceDistribution: { source: string; percent: number }[] = [];
  hourlyOrders: { hour: string; count: number }[] = [];
  maxHourlyCount = 1;
  lowStock: { ingredient: string; stock: number; unit: string; min: number }[] = [];
  activeDeliveries: { address: string; eta: string; driver: string }[] = [];

  activityBars: { day: string; orders: number }[] = [];
  maxOrders = 1;
  nextPrep = '—';
  viewMode: 'days' | 'months' = 'days';

  skeletonCards = Array(4).fill(0);
  skeletonRows = Array(3).fill(0);
  skeletonBars = Array(7).fill(0);

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private ingredientService: IngredientService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    const chartContainer = document.querySelector('.sales-panel .line-chart');
    if (chartContainer) {
      chartContainer.addEventListener('wheel', this.onWheel as EventListener);
    }
  }

  onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomLevel = Math.max(this.zoomMin, this.zoomLevel - 1);
    } else {
      this.zoomLevel = Math.min(this.zoomMax, this.zoomLevel + 1);
    }
    this.updateFilteredChartData();
  };

  showTooltip(event: MouseEvent, point: any) {
    this.tooltipData = { displayDate: point.displayDate, value: point.value };
    this.tooltipVisible = true;
    this.tooltipX = event.clientX + 10;
    this.tooltipY = event.clientY - 30;
  }

  hideTooltip() {
    this.tooltipVisible = false;
    this.tooltipData = null;
  }

  updateFilteredChartData() {
    if (this.chartData.length === 0) return;
    
    if (this.zoomLevel > 30) {
      this.viewMode = 'months';
      this.filteredChartData = this.aggregateByMonth();
    } else {
      this.viewMode = 'days';
      if (this.chartData.length <= this.zoomLevel) {
        this.filteredChartData = [...this.chartData];
      } else {
        this.filteredChartData = this.chartData.slice(-this.zoomLevel);
      }
    }
    
    this.maxSalesValue = Math.max(...this.filteredChartData.map(d => d.value), 1);
    this.cdr.detectChanges();
  }

  aggregateByMonth(): { date: Date; day: string; value: number; displayDate: string }[] {
    const monthMap = new Map<string, { date: Date; value: number; count: number }>();
    
    this.chartData.forEach(item => {
      const monthKey = `${item.date.getFullYear()}-${item.date.getMonth()}`;
      
      if (monthMap.has(monthKey)) {
        const existing = monthMap.get(monthKey)!;
        existing.value += item.value;
        existing.count++;
      } else {
        monthMap.set(monthKey, {
          date: new Date(item.date.getFullYear(), item.date.getMonth(), 1),
          value: item.value,
          count: 1
        });
      }
    });
    
    const result = Array.from(monthMap.entries())
      .map(([key, data]) => ({
        date: data.date,
        day: data.date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        value: data.value,
        displayDate: data.date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return result;
  }
  private safeAmount(amount: any): number {
    if (amount === null || amount === undefined) return 0;
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const cleaned = amount.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  private cleanNumber(value: number): number {
    if (value === null || value === undefined) return 0;
    const cleaned = parseFloat(value.toFixed(10).replace(/\.?0+$/, ''));
    return isNaN(cleaned) ? 0 : cleaned;
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    try {
      const [orders, products, ingredients] = await Promise.all([
        this.orderService.getAll().toPromise(),
        this.productService.getAll().toPromise(),
        this.ingredientService.getAll().toPromise()
      ]);

      console.log('Загружено заказов:', orders?.length);
      console.log('Загружено ингредиентов:', ingredients?.length);

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const todayOrders = (orders || []).filter(o => {
        let orderDate = o.due_at || o.created_at;
        if (orderDate) orderDate = orderDate.split('T')[0];
        return orderDate === todayStr;
      });
      const uniqueCustomers = new Set(todayOrders.map(o => o.customer_name));
      let totalAmountToday = 0;
      todayOrders.forEach(o => {
        totalAmountToday += this.safeAmount(o.amount);
      });

      this.stats = {
        total_orders_today: todayOrders.length,
        revenue_today: totalAmountToday,
        new_customers: uniqueCustomers.size,
        avg_check: todayOrders.length ? Math.round(totalAmountToday / todayOrders.length) : 0
      };

      let activeOrders = 0;
      (orders || []).forEach(o => {
        if (o.status === 'Новый' || o.status === 'Готовится' || o.status === 'Доставляется') {
          activeOrders++;
        }
      });
      let avgPrep = 0;
      if (products && products.length) {
        let sumPrep = 0;
        products.forEach(p => { sumPrep += p.prep_time || 0; });
        avgPrep = Math.round(sumPrep / products.length);
      }
      let onTime = 0;
      (orders || []).forEach(o => {
        if (o.status === 'Завершён' && o.due_at) {
          const dueDate = new Date(o.due_at);
          const createdDate = new Date(o.created_at || o.due_at);
          if (dueDate >= createdDate) onTime++;
        }
      });
      const onTimePercent = (orders || []).length ? Math.round((onTime / (orders || []).length) * 100) : 0;

      this.extendedStats = {
        avg_prep_time: avgPrep ? `${avgPrep} мин` : '—',
        on_time_percent: onTimePercent,
        active_orders: activeOrders,
        couriers: 3
      };

      this.chartData = this.buildChartData(orders || []);
      this.updateFilteredChartData();
      const weekStats = this.computeWeekActivity(orders || []);
      this.activityBars = weekStats.bars;
      const maxOrderValue = Math.max(...this.activityBars.map(b => b.orders), 0);
      this.maxOrders = maxOrderValue > 0 ? maxOrderValue : 1;
      console.log('activityBars:', this.activityBars);
      console.log('maxOrders:', this.maxOrders);

      this.hourlyOrders = this.computeHourlyOrders(todayOrders);
      this.maxHourlyCount = Math.max(...this.hourlyOrders.map(h => h.count), 1);

      this.recentOrders = (orders || [])
        .sort((a, b) => {
          const dateA = new Date(b.created_at || b.due_at).getTime();
          const dateB = new Date(a.created_at || a.due_at).getTime();
          return dateA - dateB;
        })
        .slice(0, 5)
        .map(o => ({
          id: o.id,
          code: o.code,
          customer_name: o.customer_name,
          status: o.status,
          delivery_type: o.delivery_type,
          amount: this.safeAmount(o.amount),
          time: this.formatTimeAgo(o.created_at || o.due_at)
        }));

      this.popular = this.computePopularProducts(orders || [], products || []);
      this.sourceDistribution = this.computeSourceDistribution(orders || []);
      this.lowStock = (ingredients || [])
        .filter(i => {
          const stock = Number(i.stock) || 0;
          const minStock = Number(i.min_stock) || 0;
          return stock <= minStock && stock > 0;
        })
        .map(i => ({
          ingredient: i.name,
          stock: this.cleanNumber(Number(i.stock)),
          unit: i.unit || 'шт',
          min: this.cleanNumber(Number(i.min_stock))
        }));

      console.log('lowStock:', this.lowStock);

      this.activeDeliveries = (orders || [])
        .filter(o => o.delivery_type === 'Доставка' && o.status === 'Доставляется')
        .map(o => ({
          address: o.address || '—',
          eta: this.formatEta(o.due_at),
          driver: 'Курьер'
        }));

      const topProduct = this.computeTopProductLastWeek(orders || [], products || []);
      this.nextPrep = topProduct ? `${topProduct.name} (завтра)` : 'Нет данных';

      this.loading = false;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Ошибка загрузки дашборда', err);
      this.loading = false;
    }
  }

  private buildChartData(orders: any[]): { date: Date; day: string; value: number; displayDate: string }[] {
    const dateMap = new Map<string, number>();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    orders.forEach(order => {
      let orderDate = order.due_at || order.created_at;
      if (orderDate) {
        orderDate = orderDate.split('T')[0];
        const date = new Date(orderDate);
        if (date >= startDate) {
          const dateKey = orderDate;
          let amount = this.safeAmount(order.amount);
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + amount);
        }
      }
    });
    
    const result: { date: Date; day: string; value: number; displayDate: string }[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= new Date()) {
      const dateKey = currentDate.toISOString().slice(0, 10);
      const value = dateMap.get(dateKey) || 0;
      result.push({
        date: new Date(currentDate),
        day: currentDate.toLocaleDateString('ru-RU', { weekday: 'short' }),
        value: value,
        displayDate: `${currentDate.getDate()} ${this.getMonthName(currentDate)}`
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }

  private getMonthName(date: Date): string {
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return months[date.getMonth()];
  }

  private computeWeekActivity(orders: any[]): { bars: { day: string; orders: number }[]; sales: { day: string; value: number }[] } {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const ordersByDay = new Array(7).fill(0);
  const salesByDay = new Array(7).fill(0);
  
  const today = new Date();
  const currentDay = today.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  console.log('Сегодня:', today.toLocaleDateString(), 'день недели:', today.getDay());
  console.log('Понедельник этой недели:', monday.toLocaleDateString());
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    let dayOrdersCount = 0;
    
    orders.forEach(order => {
      let orderDate = order.due_at || order.created_at;
      if (orderDate) {
        orderDate = orderDate.split('T')[0];
        if (orderDate === dateStr) {
          dayOrdersCount++;
        }
      }
    });
    
    ordersByDay[i] = dayOrdersCount;
    
    console.log(`${days[i]} (${dateStr}): заказов = ${dayOrdersCount}`);
  }
  
  return {
    bars: days.map((day, idx) => ({ day, orders: ordersByDay[idx] })),
    sales: days.map((day, idx) => ({ day, value: salesByDay[idx] }))
  };
}

 private computeHourlyOrders(todayOrders: any[]): { hour: string; count: number }[] {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const counts = new Array(24).fill(0);
  
  todayOrders.forEach(order => {
    const orderDate = order.due_at || order.created_at;
    if (orderDate) {
      const date = new Date(orderDate);
      const hour = date.getHours();
      counts[hour]++;
    }
  });
  
  const result: { hour: string; count: number }[] = [];
  for (let i = 8; i <= 22; i++) {
    result.push({
      hour: `${i}:00`,
      count: counts[i]
    });
  }
  
  return result;
}

  private computePopularProducts(orders: any[], products: Product[]): PopularProduct[] {
    const salesMap = new Map<number, number>();
    orders.forEach(order => {
      if (order.items && order.items.length) {
        order.items.forEach((item: any) => {
          const productId = item.product_id;
          const quantity = Number(item.quantity) || 0;
          salesMap.set(productId, (salesMap.get(productId) || 0) + quantity);
        });
      }
    });
    
    if (salesMap.size === 0) {
      return [{ name: 'Нет данных', sold: 0, trend: 'stable' }];
    }
    
    const top = Array.from(salesMap.entries())
      .map(([id, sold]) => ({
        id,
        sold,
        name: products.find(p => p.id === id)?.name || 'Неизвестный'
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 4);
      
    return top.map(p => ({
      name: p.name,
      sold: p.sold,
      trend: 'up'
    }));
  }

  private computeSourceDistribution(orders: any[]): { source: string; percent: number }[] {
    const sourceCount = new Map<string, number>();
    orders.forEach(o => {
      const src = o.source || 'Сайт';
      sourceCount.set(src, (sourceCount.get(src) || 0) + 1);
    });
    const total = orders.length;
    if (total === 0) {
      return [{ source: 'Нет данных', percent: 100 }];
    }
    return Array.from(sourceCount.entries())
      .map(([source, count]) => ({
        source,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.percent - a.percent);
  }

  private computeTopProductLastWeek(orders: any[], products: Product[]): Product | null {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const salesMap = new Map<number, number>();
    orders.forEach(order => {
      let orderDate = order.created_at || order.due_at;
      if (orderDate) {
        orderDate = orderDate.split('T')[0];
        if (new Date(orderDate) >= weekAgo && order.items) {
          order.items.forEach((item: any) => {
            const productId = item.product_id;
            const quantity = Number(item.quantity) || 0;
            salesMap.set(productId, (salesMap.get(productId) || 0) + quantity);
          });
        }
      }
    });
    let bestId = -1;
    let bestQty = 0;
    for (const [id, qty] of salesMap) {
      if (qty > bestQty) {
        bestQty = qty;
        bestId = id;
      }
    }
    return products.find(p => p.id === bestId) || null;
  }

  private formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'только что';
    if (diff < 60) return `${diff} мин`;
    const hours = Math.floor(diff / 60);
    return `${hours} ч`;
  }

  private formatEta(dueAt?: string): string {
    if (!dueAt) return '—';
    const due = new Date(dueAt);
    return due.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Новый': return 'status-new';
      case 'Готовится': return 'status-preparing';
      case 'Доставляется': return 'status-delivering';
      case 'Завершён': return 'status-completed';
      default: return '';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
      default: return '';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  }

  getConicGradient(segments: { percent: number; color: string }[]): string {
    if (!segments.length) return 'conic-gradient(#e5e7eb 0% 100%)';
    let gradient = '';
    let cumulative = 0;
    for (const seg of segments) {
      gradient += `${seg.color} ${cumulative}% ${cumulative + seg.percent}%, `;
      cumulative += seg.percent;
    }
    return `conic-gradient(${gradient.slice(0, -2)})`;
  }

  getSourceColors(): { percent: number; color: string }[] {
    if (!this.sourceDistribution.length) {
      return [{ percent: 100, color: '#e5e7eb' }];
    }
    return this.sourceDistribution.map((s, i) => ({
      percent: s.percent,
      color: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'][i % 4]
    }));
  }
  
  getPolylinePoints(): string {
    if (!this.filteredChartData.length || this.filteredChartData.length < 2) return '';
    const width = 600;
    const height = 200;
    const maxVal = this.maxSalesValue;
    const step = width / (this.filteredChartData.length - 1);
    
    return this.filteredChartData.map((p, i) =>
      `${i * step},${height - (p.value / maxVal) * (height - 40)}`
    ).join(' ');
  }
  
  getCirclePositions(): { cx: number; cy: number }[] {
    if (!this.filteredChartData.length) return [];
    const width = 600;
    const height = 200;
    const maxVal = this.maxSalesValue;
    const step = width / (this.filteredChartData.length - 1);
    
    return this.filteredChartData.map((p, i) => ({
      cx: i * step,
      cy: height - (p.value / maxVal) * (height - 40)
    }));
  }
  
  getYAxisTicks(): number[] {
    const max = this.maxSalesValue;
    if (max <= 0) return [0];
    const step = Math.ceil(max / 4);
    return [max, step * 3, step * 2, step, 0];
  }
}