import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../data/services/order.service';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { Production2Service } from '../../data/services/production2.service';

@Component({
  selector: 'app-statistics-page',
  templateUrl: './statistics-page.html',
  styleUrls: ['./statistics-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class StatisticsPage implements OnInit {
  loading = true;

  activePeriod: 'today' | 'week' | 'month' = 'week';

  kpi = {
    revenue: 0,
    orders: 0,
    avgCheck: 0,
    newCustomers: 0,
    returns: 0,
    nps: 72
  };

  revenueByDay: { day: string; value: number }[] = [];
  maxRevenueDay = 1;

  revenueByMonth: { month: string; value: number }[] = [];
  maxRevenueMonth = 1;

  popularProducts: { name: string; orders: number; percent: number }[] = [];
  maxPopularOrders = 1;

  sources: { name: string; percent: number; color: string }[] = [];
  topCategories: { name: string; revenue: number; percent: number; color: string }[] = [];

  funnel: { stage: string; count: number; percent: number }[] = [];
  productionLoad: { workshop: string; current: number; max: number; color: string }[] = [];

  employees = [
    { name: 'Мария Иванова', orders: 28, revenue: 78400, efficiency: 95 },
    { name: 'Иван Петров', orders: 22, revenue: 61200, efficiency: 88 },
    { name: 'Анна Сидорова', orders: 18, revenue: 50400, efficiency: 92 },
    { name: 'Дмитрий Кузьмин', orders: 15, revenue: 42300, efficiency: 85 }
  ];

  forecast = [
    { day: 'Пн', predicted: 22, recommended: 'Заготовить 25 кг муки' },
    { day: 'Вт', predicted: 28, recommended: 'Заготовить 30 кг муки' },
    { day: 'Ср', predicted: 32, recommended: 'Усилить смену' },
    { day: 'Чт', predicted: 26, recommended: 'Штатный режим' },
    { day: 'Пт', predicted: 35, recommended: 'Доп. курьер' },
    { day: 'Сб', predicted: 20, recommended: 'Штатный режим' },
    { day: 'Вс', predicted: 12, recommended: 'Сокращённый день' }
  ];

  skeletonCards = Array(6).fill(0);
  skeletonRows = Array(4).fill(0);
  lineChartPoints = '';
  lineChartCircles: { cx: number; cy: number; show: boolean; index: number; month: string; value: number }[] = [];
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipData: { month: string; value: number } | null = null;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private productionService: Production2Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  setPeriod(period: 'today' | 'week' | 'month'): void {
    this.activePeriod = period;
    this.loadData();
  }

  private safeNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private filterOrdersByPeriod(orders: any[]): any[] {
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (this.activePeriod === 'today') {
      const todayStr = todayLocal.toISOString().slice(0, 10);
      return orders.filter(o => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        const orderLocal = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
        return orderLocal.toISOString().slice(0, 10) === todayStr;
      });
    } else if (this.activePeriod === 'week') {
      const weekAgo = new Date(todayLocal);
      weekAgo.setDate(todayLocal.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      const todayStr = todayLocal.toISOString().slice(0, 10);
      
      return orders.filter(o => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        const orderLocal = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
        const dateStr = orderLocal.toISOString().slice(0, 10);
        return dateStr >= weekAgoStr && dateStr <= todayStr;
      });
    } else if (this.activePeriod === 'month') {
      const monthAgo = new Date(todayLocal);
      monthAgo.setDate(todayLocal.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().slice(0, 10);
      const todayStr = todayLocal.toISOString().slice(0, 10);
      
      return orders.filter(o => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        const orderLocal = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
        const dateStr = orderLocal.toISOString().slice(0, 10);
        return dateStr >= monthAgoStr && dateStr <= todayStr;
      });
    }
    return orders;
  }

  private loadData(): void {
    this.loading = true;
    Promise.all([
      this.orderService.getAll().toPromise(),
      this.productService.getAll().toPromise(),
      this.productionService.getTasks().toPromise()
    ]).then(([orders, products, tasks]) => {
      console.log('📊 Загружены все заказы:', orders?.length);
      console.log('📊 Загружены производственные задачи:', tasks?.length);
      this.computeStatistics(orders || [], products || [], tasks || []);
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Ошибка загрузки данных статистики', err);
      this.loading = false;
    });
  }

  private computeStatistics(orders: any[], products: Product[], tasks: any[]): void {
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let filteredOrders = this.filterOrdersByPeriod(orders);
    
    console.log('📊 Активный период:', this.activePeriod);
    console.log('📊 Отфильтровано заказов:', filteredOrders.length);
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + this.safeNumber(o.amount), 0);
    const totalOrders = filteredOrders.length;
    const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customer_name)).size;

    this.kpi = {
      revenue: Math.round(totalRevenue),
      orders: totalOrders,
      avgCheck: Math.round(avgCheck),
      newCustomers: uniqueCustomers,
      returns: 0,
      nps: 72
    };
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const revenueByDayMap = new Array(7).fill(0);
    
    const currentDayOfWeek = todayLocal.getDay();
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    let monday = new Date(todayLocal);
    monday.setDate(todayLocal.getDate() - daysFromMonday);
    
    const ordersByDate = new Map<string, { count: number; revenue: number }>();
    
    orders.forEach(order => {
      if (!order.created_at) return;
      
      const orderDate = new Date(order.created_at);
      const orderLocalDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      const dateStr = orderLocalDate.toISOString().slice(0, 10);
      
      if (!ordersByDate.has(dateStr)) {
        ordersByDate.set(dateStr, { count: 0, revenue: 0 });
      }
      
      const entry = ordersByDate.get(dateStr)!;
      entry.count++;
      entry.revenue += this.safeNumber(order.amount);
    });
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const entry = ordersByDate.get(dateStr);
      const dayRevenue = entry ? Math.round(entry.revenue) : 0;
      
      revenueByDayMap[i] = dayRevenue;
    }
    
    this.revenueByDay = dayNames.map((day, idx) => ({ day, value: revenueByDayMap[idx] }));
    this.maxRevenueDay = Math.max(...revenueByDayMap, 1);
    this.computeFunnel(filteredOrders);
    this.computeProductionLoad(tasks);
    const currentYear = now.getFullYear();
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const revenueByMonthMap = new Array(12).fill(0);
    orders.forEach(order => {
      if (!order.created_at) return;
      const date = new Date(order.created_at);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        revenueByMonthMap[month] += this.safeNumber(order.amount);
      }
    });
    
    this.revenueByMonth = months.map((month, idx) => ({ 
      month, 
      value: Math.round(revenueByMonthMap[idx]) 
    }));
    this.maxRevenueMonth = Math.max(...revenueByMonthMap.map(v => Math.round(v)), 1);
    
    this.updateChartData();
    const productSales = new Map<number, number>();
    filteredOrders.forEach(order => {
      if (order.items && order.items.length) {
        order.items.forEach((item: any) => {
          const productId = item.product_id;
          const qty = Math.round(this.safeNumber(item.quantity));
          if (qty > 0) {
            productSales.set(productId, (productSales.get(productId) || 0) + qty);
          }
        });
      }
    });
    
    const productList = Array.from(productSales.entries())
      .map(([id, sold]) => ({
        id,
        sold,
        name: products.find(p => p.id === id)?.name || 'Неизвестный'
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    
    this.popularProducts = productList.map(p => ({
      name: p.name,
      orders: p.sold,
      percent: productList[0]?.sold ? Math.round((p.sold / productList[0].sold) * 100) : 0
    }));
    this.maxPopularOrders = productList[0]?.sold || 1;
    const sourceCount = new Map<string, number>();
    filteredOrders.forEach(o => {
      const src = o.source || 'Сайт';
      sourceCount.set(src, (sourceCount.get(src) || 0) + 1);
    });
    const total = filteredOrders.length;
    const sourceColors = ['#3b82f6', '#10b981', '#f59e0b', '#14b8a6', '#f97316', '#8b5cf6'];
    this.sources = Array.from(sourceCount.entries())
      .map(([name, count], idx) => ({
        name,
        percent: total ? Math.round((count / total) * 100) : 0,
        color: sourceColors[idx % sourceColors.length]
      }))
      .sort((a, b) => b.percent - a.percent);
    this.computeTopCategories(filteredOrders, products);
    
    console.log('📊 Воронка продаж:', this.funnel);
    console.log('📊 Загрузка производства:', this.productionLoad);
  }

  /**
   * Вычисляет загрузку производства на основе статусов производственных задач
   */
  private computeProductionLoad(tasks: any[]): void {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ожидает',
      'preparing': 'Подготовка',
      'baking': 'Выпечка',
      'cooling': 'Остывание',
      'packing': 'Упаковка',
      'completed': 'Завершено'
    };

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#14b8a6', '#8b5cf6', '#6b7280'];
    const statusCount = new Map<string, number>();
    
    tasks.forEach(task => {
      const status = task.status || 'pending';
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });
    const maxCount = Math.max(...Array.from(statusCount.values()), 1);
    const loadData: { workshop: string; current: number; max: number; color: string }[] = [];
    let colorIndex = 0;
    
    statusCount.forEach((count, status) => {
      const statusName = statusMap[status] || status;
      loadData.push({
        workshop: statusName,
        current: count,
        max: maxCount,
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    });
    loadData.sort((a, b) => b.current - a.current);
    
    if (loadData.length > 0) {
      this.productionLoad = loadData;
    } else {
      this.productionLoad = [
        { workshop: 'Нет активных задач', current: 0, max: 1, color: '#d4d4d8' }
      ];
    }
  }

  /**
   * Вычисляет воронку продаж на основе статусов заказов
   */
  private computeFunnel(orders: any[]): void {
    const total = orders.length;
    
    if (total === 0) {
      this.funnel = [
        { stage: 'Завершены', count: 0, percent: 25 },
        { stage: 'Доставляются', count: 0, percent: 25 },
        { stage: 'Готовятся', count: 0, percent: 25 },
        { stage: 'Новые заказы', count: 0, percent: 25 }
      ];
      return;
    }
    
    const newOrders = orders.filter(o => o.status === 'Новый').length;
    const preparing = orders.filter(o => o.status === 'Готовится').length;
    const delivering = orders.filter(o => o.status === 'Доставляется').length;
    const completed = orders.filter(o => o.status === 'Завершён').length;
    
    const maxCount = Math.max(newOrders, preparing, delivering, completed, 1);
    
    const minPercent = 25;
    const maxPercent = 100;
    const range = maxPercent - minPercent;
    
    const unsorted = [
      { stage: 'Новые заказы', count: newOrders, percent: Math.round(minPercent + (newOrders / maxCount) * range) },
      { stage: 'Готовятся', count: preparing, percent: Math.round(minPercent + (preparing / maxCount) * range) },
      { stage: 'Доставляются', count: delivering, percent: Math.round(minPercent + (delivering / maxCount) * range) },
      { stage: 'Завершены', count: completed, percent: Math.round(minPercent + (completed / maxCount) * range) }
    ];
    
    this.funnel = unsorted.sort((a, b) => b.count - a.count || b.percent - a.percent);
  }

  private computeTopCategories(orders: any[], products: Product[]): void {
    const categoryRevenue = new Map<string, number>();
    
    orders.forEach(order => {
      if (order.items && order.items.length) {
        order.items.forEach((item: any) => {
          const productId = item.product_id;
          const product = products.find(p => p.id === productId);
          if (product && product.category) {
            const revenue = this.safeNumber(item.total) || (this.safeNumber(item.quantity) * this.safeNumber(item.price));
            categoryRevenue.set(product.category, (categoryRevenue.get(product.category) || 0) + revenue);
          }
        });
      }
    });
    
    const totalRevenue = Array.from(categoryRevenue.values()).reduce((sum, val) => sum + val, 0);
    const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#8b5cf6', '#ec4899'];
    
    this.topCategories = Array.from(categoryRevenue.entries())
      .map(([name, revenue], idx) => ({
        name,
        revenue: Math.round(revenue),
        percent: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
        color: categoryColors[idx % categoryColors.length]
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }

  private updateChartData(): void {
    const allMonths = this.revenueByMonth;
    const maxValue = Math.max(...allMonths.map(m => m.value), 1);
    const width = 600;
    const height = 180;
    const step = allMonths.length > 1 ? width / (allMonths.length - 1) : width;
    
    const points = allMonths.map((m, i) => {
      const x = i * step;
      const percent = m.value / maxValue;
      const y = height - (percent * (height - 20));
      return `${x},${y}`;
    }).join(' ');
    
    this.lineChartPoints = points;
    
    this.lineChartCircles = allMonths.map((m, i) => {
      const x = i * step;
      const percent = m.value / maxValue;
      const y = height - (percent * (height - 20));
      return {
        cx: x,
        cy: y,
        show: m.value > 0,
        index: i,
        month: m.month,
        value: m.value
      };
    });
  }

  showTooltip(event: MouseEvent, index: number): void {
    const monthData = this.revenueByMonth[index];
    if (monthData && monthData.value > 0) {
      this.tooltipData = {
        month: monthData.month,
        value: monthData.value
      };
      this.tooltipVisible = true;
      this.tooltipX = event.clientX + 15;
      this.tooltipY = event.clientY - 30;
    }
  }

  hideTooltip(): void {
    this.tooltipVisible = false;
    this.tooltipData = null;
  }

  getConicGradient(segments: { percent: number; color: string }[]): string {
    if (!segments.length) return 'conic-gradient(#e5e7eb 0% 100%)';
    let cumulative = 0;
    const parts = segments.map(s => {
      const start = cumulative;
      cumulative += s.percent;
      return `${s.color} ${start}% ${cumulative}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }
  
  getPolylinePoints(): string {
    return this.lineChartPoints;
  }
  
  getCirclePositions(): { cx: number; cy: number; show: boolean; index: number; month: string; value: number }[] {
    return this.lineChartCircles;
  }
}