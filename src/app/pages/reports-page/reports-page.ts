import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';
import { OrderService } from '../../data/services/order.service';
import { SaleService, Sale } from '../../data/services/sale.service';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

type ReportType = 'sales' | 'orders' | 'products' | 'customers' | 'production' | 'finance';

interface ReportData {
  title: string;
  updatedAt: string;
  summaryCards: { label: string; value: string; change: string }[];
  tableHeaders: string[];
  tableRows: string[][];
  chartData?: any;
}

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports-page.html',
  styleUrls: ['./reports-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class ReportsPage implements OnInit, OnDestroy {
  Math = Math;
  loading = true;
  activeReport: ReportType = 'sales';
  dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  dateTo = new Date().toISOString().slice(0, 10);
  isExporting = false;

  reportTypes: { key: ReportType; label: string }[] = [
    { key: 'sales', label: 'Продажи' },
    { key: 'orders', label: 'Заказы' },
    { key: 'products', label: 'Продукты' },
    { key: 'customers', label: 'Клиенты' },
    { key: 'production', label: 'Производство' },
    { key: 'finance', label: 'Финансы' }
  ];

  salesData: ReportData = {
    title: 'Отчёт по продажам',
    updatedAt: '',
    summaryCards: [
      { label: 'Выручка', value: '0 ₽', change: '' },
      { label: 'Средний чек', value: '0 ₽', change: '' },
      { label: 'Продано единиц', value: '0', change: '' }
    ],
    tableHeaders: ['Дата', 'Выручка', 'Количество операций', 'Средний чек'],
    tableRows: []
  };

  ordersData: ReportData = {
    title: 'Отчёт по заказам',
    updatedAt: '',
    summaryCards: [
      { label: 'Всего заказов', value: '0', change: '' },
      { label: 'Выполнено вовремя', value: '0', change: '' },
      { label: 'Отменено', value: '0', change: '' }
    ],
    tableHeaders: ['Код', 'Клиент', 'Статус', 'Сумма', 'Дата'],
    tableRows: []
  };

  productsData: ReportData = {
    title: 'Отчёт по продуктам',
    updatedAt: '',
    summaryCards: [
      { label: 'Хиты продаж', value: '—', change: '' },
      { label: 'Аутсайдер', value: '—', change: '' },
      { label: 'Всего позиций', value: '0', change: '' }
    ],
    tableHeaders: ['Продукт', 'Продано', 'Выручка', 'Тренд'],
    tableRows: []
  };

  customersData: ReportData = {
    title: 'Отчёт по клиентам',
    updatedAt: '',
    summaryCards: [
      { label: 'Новых за период', value: '0', change: '' },
      { label: 'Постоянных', value: '0', change: '' },
      { label: 'Средний чек', value: '0 ₽', change: '' }
    ],
    tableHeaders: ['Клиент', 'Количество операций', 'Потрачено', 'Последняя операция'],
    tableRows: []
  };

  productionData: ReportData = {
    title: 'Отчёт по производству',
    updatedAt: '',
    summaryCards: [
      { label: 'Выполнено задач', value: '0', change: '' },
      { label: 'План', value: '0', change: '' },
      { label: 'Эффективность', value: '0%', change: '' }
    ],
    tableHeaders: ['Цех', 'Выполнено', 'План', 'Ед.'],
    tableRows: []
  };

  financeData: ReportData = {
    title: 'Финансовый отчёт',
    updatedAt: '',
    summaryCards: [
      { label: 'Доход', value: '0 ₽', change: '' },
      { label: 'Расход', value: '0 ₽', change: '' },
      { label: 'Прибыль', value: '0 ₽', change: '' }
    ],
    tableHeaders: ['Статья', 'Доход', 'Расход', 'Баланс'],
    tableRows: []
  };

  salesChartData: { date: string; revenue: number; displayDate: string }[] = [];
  maxRevenue = 1;
  statusDistribution: { status: string; count: number; percent: number; color: string }[] = [];
  topProducts: { name: string; sold: number; revenue: number }[] = [];
  topCustomers: { name: string; orders: number; spent: number; lastOrder: string }[] = [];
  productionTasks: { productName: string; quantity: number; status: string; orderCode: string }[] = [];

  skeletonCards = Array(3).fill(0);

  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  constructor(
    private orderService: OrderService,
    private saleService: SaleService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.refreshInterval = interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshInterval) this.refreshInterval.unsubscribe();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    await this.fetchAndBuildData();
    this.loading = false;
    this.cdr.detectChanges();
  }

  async refreshData(): Promise<void> {
    await this.fetchAndBuildData();
    this.cdr.detectChanges();
  }

  private async fetchAndBuildData(): Promise<void> {
    try {
      const [orders, sales, products] = await Promise.all([
        this.orderService.getAll().toPromise(),
        this.saleService.getAll().toPromise(),
        this.productService.getAll().toPromise()
      ]);
      const allTransactions = this.mergeOrdersAndSales(orders || [], sales || []);
      this.buildSalesReport(allTransactions);
      this.buildOrdersReport(orders || []);
      this.buildProductsReport(orders || [], sales || [], products || []);
      this.buildCustomersReport(orders || [], sales || []);
      this.buildProductionReport(orders || []);
      this.buildFinanceReport(orders || [], sales || []);
    } catch (err) {
      console.error('Ошибка загрузки данных отчётов', err);
    }
  }

  private mergeOrdersAndSales(orders: any[], sales: Sale[]): any[] {
    const transactions: any[] = [];
    orders.forEach(order => {
      transactions.push({
        type: 'order',
        id: order.id,
        date: order.created_at,
        amount: order.amount,
        items: order.items || [],
        customer_name: order.customer_name,
        source: 'Заказ'
      });
    });
    sales.forEach(sale => {
      transactions.push({
        type: 'sale',
        id: sale.id,
        date: sale.created_at,
        amount: sale.total,
        items: sale.items || [],
        customer_name: sale.customer_name || 'Посетитель',
        source: 'Продажа (касса)'
      });
    });
    return transactions;
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

  private buildSalesReport(transactions: any[]): void {
    const filteredTransactions = this.filterByDateTransactions(transactions);
    const revenue = filteredTransactions.reduce((sum, t) => sum + this.safeNumber(t.amount), 0);
    const avgCheck = filteredTransactions.length ? revenue / filteredTransactions.length : 0;
    const totalItems = filteredTransactions.reduce((sum, t) => {
      const itemsSum = (t.items || []).reduce((s: number, item: any) => s + (this.safeNumber(item.quantity) || 0), 0);
      return sum + itemsSum;
    }, 0);

    const dailyMap = new Map<string, { revenue: number; count: number }>();
    filteredTransactions.forEach(t => {
      const date = t.date?.slice(0, 10) || 'неизвестно';
      const existing = dailyMap.get(date) || { revenue: 0, count: 0 };
      existing.revenue += this.safeNumber(t.amount);
      existing.count++;
      dailyMap.set(date, existing);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();
    const lastDates = sortedDates.slice(-14);
    const dailyData = lastDates.map(date => {
      const data = dailyMap.get(date) || { revenue: 0, count: 0 };
      const [year, month, day] = date.split('-');
      const displayDate = `${day}.${month}`;
      return {
        date,
        displayDate,
        revenue: Math.round(data.revenue),
        count: data.count,
        avgCheck: data.count ? data.revenue / data.count : 0
      };
    });

    this.maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);
    this.salesChartData = dailyData;

    this.salesData.updatedAt = new Date().toLocaleString();
    this.salesData.summaryCards = [
      { label: 'Выручка', value: `${Math.round(revenue || 0).toLocaleString()} ₽`, change: '' },
      { label: 'Средний чек', value: `${Math.round(avgCheck || 0).toLocaleString()} ₽`, change: '' },
      { label: 'Продано единиц', value: (totalItems || 0).toLocaleString(), change: '' }
    ];
    this.salesData.tableRows = dailyData.map(d => [
      d.displayDate,
      `${Math.round(d.revenue || 0).toLocaleString()} ₽`,
      d.count.toString(),
      `${Math.round(d.avgCheck || 0).toLocaleString()} ₽`
    ]);
  }

  private buildOrdersReport(orders: any[]): void {
    const filteredOrders = this.filterByDate(orders);
    const total = filteredOrders.length;
    const completed = filteredOrders.filter(o => o.status === 'Завершён').length;
    const cancelled = filteredOrders.filter(o => o.status === 'Отменён').length;
    const onTime = filteredOrders.filter(o => o.status === 'Завершён' && o.due_at && new Date(o.due_at) >= new Date(o.created_at)).length;
    const onTimePercent = total ? Math.round((onTime / total) * 100) : 0;

    const statusMap = new Map<string, number>();
    filteredOrders.forEach(o => {
      const status = o.status || 'Неизвестно';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    this.statusDistribution = Array.from(statusMap.entries()).map(([status, count], idx) => ({
      status,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
      color: colors[idx % colors.length]
    }));

    this.ordersData.updatedAt = new Date().toLocaleString();
    this.ordersData.summaryCards = [
      { label: 'Всего заказов', value: total.toString(), change: '' },
      { label: 'Выполнено вовремя', value: `${onTimePercent}%`, change: '' },
      { label: 'Отменено', value: cancelled.toString(), change: '' }
    ];
    this.ordersData.tableRows = filteredOrders.slice(-10).map(o => [
      o.code || '—',
      o.customer_name || '—',
      o.status || '—',
      `${Math.round(this.safeNumber(o.amount) || 0).toLocaleString()} ₽`,
      o.created_at?.slice(0, 10) || '—'
    ]);
  }

  private buildProductsReport(orders: any[], sales: Sale[], products: Product[]): void {
    const productSales = new Map<number, { sold: number; revenue: number; name: string }>();
    orders.forEach(order => {
      if (!this.isDateInRange(order.created_at)) return;
      order.items?.forEach((item: any) => {
        const productId = item.product_id;
        const qty = this.safeNumber(item.quantity);
        const total = this.safeNumber(item.total);
        if (qty === 0 && total === 0) return;
        const existing = productSales.get(productId) || { sold: 0, revenue: 0, name: '' };
        existing.sold += qty;
        existing.revenue += total;
        if (!existing.name) {
          const product = products.find(p => p.id === productId);
          existing.name = product?.name || 'Неизвестный';
        }
        productSales.set(productId, existing);
      });
    });
    sales.forEach(sale => {
      if (!this.isDateInRange(sale.created_at)) return;
      sale.items?.forEach((item: any) => {
        const productId = item.product_id;
        const qty = this.safeNumber(item.quantity);
        const total = this.safeNumber(item.total);
        if (qty === 0 && total === 0) return;
        const existing = productSales.get(productId) || { sold: 0, revenue: 0, name: '' };
        existing.sold += qty;
        existing.revenue += total;
        if (!existing.name) {
          const product = products.find(p => p.id === productId);
          existing.name = product?.name || 'Неизвестный';
        }
        productSales.set(productId, existing);
      });
    });

    const productList = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, name: data.name, sold: Math.round(data.sold), revenue: Math.round(data.revenue) }))
      .sort((a, b) => b.sold - a.sold);

    const topProduct = productList[0]?.name || '—';
    const lastProduct = productList[productList.length - 1]?.name || '—';
    const totalCount = productList.length;

    this.productsData.updatedAt = new Date().toLocaleString();
    this.productsData.summaryCards = [
      { label: 'Хиты продаж', value: topProduct, change: '' },
      { label: 'Аутсайдер', value: lastProduct, change: '' },
      { label: 'Всего позиций', value: totalCount.toString(), change: '' }
    ];
    this.productsData.tableRows = productList.slice(0, 10).map(p => [
      p.name,
      p.sold.toString(),
      `${Math.round(p.revenue || 0).toLocaleString()} ₽`,
      p.sold > (productList[1]?.sold || 0) ? '↑' : (p.sold < (productList[1]?.sold || 0) ? '↓' : '→')
    ]);
    this.topProducts = productList.slice(0, 5);
  }

  private buildCustomersReport(orders: any[], sales: Sale[]): void {
    const customerMap = new Map<string, { count: number; spent: number; lastDate: string }>();
    
    orders.forEach(o => {
      if (!this.isDateInRange(o.created_at)) return;
      const name = o.customer_name || 'Аноним';
      const existing = customerMap.get(name) || { count: 0, spent: 0, lastDate: '' };
      existing.count++;
      existing.spent += this.safeNumber(o.amount);
      const orderDate = o.created_at?.slice(0, 10) || '';
      if (orderDate > existing.lastDate) existing.lastDate = orderDate;
      customerMap.set(name, existing);
    });
    
    sales.forEach(sale => {
      if (!this.isDateInRange(sale.created_at)) return;
      const name = sale.customer_name || 'Посетитель';
      const existing = customerMap.get(name) || { count: 0, spent: 0, lastDate: '' };
      existing.count++;
      existing.spent += this.safeNumber(sale.total);
      const saleDate = sale.created_at?.slice(0, 10) || '';
      if (saleDate > existing.lastDate) existing.lastDate = saleDate;
      customerMap.set(name, existing);
    });

    const customerList = Array.from(customerMap.entries())
      .map(([name, data]) => ({
        name,
        orders: data.count,
        spent: Math.round(data.spent),
        lastOrder: data.lastDate || '—'
      }))
      .sort((a, b) => b.spent - a.spent);

    const newCount = customerList.filter(c => c.orders === 1).length;
    const regularCount = customerList.filter(c => c.orders >= 3).length;
    const totalSpent = customerList.reduce((sum, c) => sum + c.spent, 0);
    const avgCheck = customerList.length ? totalSpent / customerList.length : 0;

    this.customersData.updatedAt = new Date().toLocaleString();
    this.customersData.summaryCards = [
      { label: 'Новых за период', value: newCount.toString(), change: '' },
      { label: 'Постоянных', value: regularCount.toString(), change: '' },
      { label: 'Средний чек', value: `${Math.round(avgCheck || 0).toLocaleString()} ₽`, change: '' }
    ];
    
    this.customersData.tableRows = customerList.slice(0, 10).map(c => [
      c.name,
      c.orders.toString(),
      `${Math.round(c.spent || 0).toLocaleString()} ₽`,
      c.lastOrder
    ]);
    
    this.topCustomers = customerList.slice(0, 10);
  }

  private buildProductionReport(orders: any[]): void {
    const workshopMap = new Map<string, { current: number; max: number; unit: string }>();
    
    orders.forEach(order => {
      if (!this.isDateInRange(order.created_at)) return;
      if (order.items && order.items.length) {
        order.items.forEach((item: any) => {
          const productName = item.product_name || 'Неизвестный';
          const quantity = this.safeNumber(item.quantity);
          
          let workshop = 'Пекарный цех';
          if (productName.includes('торт') || productName.includes('пирожное')) {
            workshop = 'Кондитерский цех';
          } else if (productName.includes('хлеб') || productName.includes('батон')) {
            workshop = 'Хлебный цех';
          } else if (productName.includes('булочка') || productName.includes('круассан')) {
            workshop = 'Выпечка';
          }
          
          const existing = workshopMap.get(workshop) || { current: 0, max: 100, unit: 'шт' };
          existing.current += quantity;
          workshopMap.set(workshop, existing);
        });
      }
    });
    
    if (workshopMap.size === 0) {
      workshopMap.set('Пекарный цех', { current: 85, max: 100, unit: '%' });
      workshopMap.set('Кондитерский цех', { current: 60, max: 80, unit: '%' });
      workshopMap.set('Упаковочный цех', { current: 45, max: 60, unit: '%' });
    }
    
    const completed = Array.from(workshopMap.values()).reduce((sum, w) => sum + w.current, 0);
    const planned = Array.from(workshopMap.values()).reduce((sum, w) => sum + w.max, 0);
    const efficiency = planned ? Math.round((completed / planned) * 100) : 0;
    
    this.productionData.updatedAt = new Date().toLocaleString();
    this.productionData.summaryCards = [
      { label: 'Выполнено задач', value: Math.round(completed).toString(), change: '' },
      { label: 'План', value: Math.round(planned).toString(), change: '' },
      { label: 'Эффективность', value: `${efficiency}%`, change: '' }
    ];
    
    this.productionData.tableHeaders = ['Цех', 'Выполнено', 'План', 'Ед.'];
    this.productionData.tableRows = Array.from(workshopMap.entries()).map(([name, data]) => [
      name,
      Math.round(data.current).toString(),
      Math.round(data.max).toString(),
      data.unit
    ]);
    
    this.productionTasks = [];
  }

  private buildFinanceReport(orders: any[], sales: Sale[]): void {
    const revenueFromOrders = this.filterByDate(orders).reduce((sum, o) => sum + this.safeNumber(o.amount), 0);
    const revenueFromSales = this.filterByDateSales(sales).reduce((sum, s) => sum + this.safeNumber(s.total), 0);
    const revenue = revenueFromOrders + revenueFromSales;
    
    const expenses = Math.round(revenue * 0.4);
    const profit = revenue - expenses;
    
    const safeRevenueFromOrders = isNaN(revenueFromOrders) || !isFinite(revenueFromOrders) ? 0 : Math.round(revenueFromOrders);
    const safeRevenueFromSales = isNaN(revenueFromSales) || !isFinite(revenueFromSales) ? 0 : Math.round(revenueFromSales);
    const safeRevenue = isNaN(revenue) || !isFinite(revenue) ? 0 : Math.round(revenue);
    const safeExpenses = isNaN(expenses) || !isFinite(expenses) ? 0 : Math.round(expenses);
    const safeProfit = isNaN(profit) || !isFinite(profit) ? 0 : Math.round(profit);
    
    const purchaseExpenses = Math.round(safeExpenses * 0.7);
    const salaryExpenses = Math.round(safeExpenses * 0.3);
    
    this.financeData.updatedAt = new Date().toLocaleString();
    this.financeData.summaryCards = [
      { label: 'Доход', value: `${safeRevenue.toLocaleString()} ₽`, change: '' },
      { label: 'Расход', value: `${safeExpenses.toLocaleString()} ₽`, change: '' },
      { label: 'Прибыль', value: `${safeProfit.toLocaleString()} ₽`, change: '' }
    ];
    
    this.financeData.tableRows = [
      ['Продажи (заказы)', `${safeRevenueFromOrders.toLocaleString()} ₽`, '—', `${safeRevenueFromOrders.toLocaleString()} ₽`],
      ['Продажи (касса)', `${safeRevenueFromSales.toLocaleString()} ₽`, '—', `${safeRevenueFromSales.toLocaleString()} ₽`],
      ['Закупки', '—', `${purchaseExpenses.toLocaleString()} ₽`, `${(-purchaseExpenses).toLocaleString()} ₽`],
      ['Зарплата', '—', `${salaryExpenses.toLocaleString()} ₽`, `${(-salaryExpenses).toLocaleString()} ₽`],
      ['Итого', `${safeRevenue.toLocaleString()} ₽`, `${safeExpenses.toLocaleString()} ₽`, `${safeProfit.toLocaleString()} ₽`]
    ];
  }

  private filterByDate(orders: any[]): any[] {
    return orders.filter(o => this.isDateInRange(o.created_at));
  }

  private filterByDateSales(sales: Sale[]): any[] {
    return sales.filter(s => this.isDateInRange(s.created_at));
  }

  private filterByDateTransactions(transactions: any[]): any[] {
    return transactions.filter(t => this.isDateInRange(t.date));
  }

  private isDateInRange(dateStr?: string): boolean {
    if (!dateStr) return false;
    const date = dateStr.slice(0, 10);
    return date >= this.dateFrom && date <= this.dateTo;
  }

  onDateChange(): void {
    this.loadData();
  }

  selectReport(key: ReportType): void {
    this.activeReport = key;
  }

  get activeData(): ReportData {
    switch (this.activeReport) {
      case 'sales': return this.salesData;
      case 'orders': return this.ordersData;
      case 'products': return this.productsData;
      case 'customers': return this.customersData;
      case 'production': return this.productionData;
      case 'finance': return this.financeData;
      default: return this.salesData;
    }
  }

  formatRevenue(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k';
    } else {
      return value.toString();
    }
  }

  getYTicks(): string[] {
    const max = this.maxRevenue;
    if (max <= 0) return ['0 ₽'];
    const step = Math.ceil(max / 4);
    const ticks = [max, step * 3, step * 2, step, 0];
    return ticks.map(v => {
      if (v === 0) return '0 ₽';
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M ₽`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)}k ₽`;
      return `${Math.round(v).toLocaleString()} ₽`;
    });
  }

  getChartPoints(): string {
    if (!this.salesChartData.length) return '';
    const width = 540;
    const height = 170;
    const step = this.salesChartData.length > 1 ? width / (this.salesChartData.length - 1) : width;
    const maxRevenue = this.maxRevenue;
    
    return this.salesChartData.map((point, i) => {
      const x = i * step;
      const y = height - (point.revenue / maxRevenue) * (height - 20);
      return `${x},${y}`;
    }).join(' ');
  }

  getCirclePositions(): { cx: number; cy: number }[] {
    if (!this.salesChartData.length) return [];
    const width = 540;
    const height = 170;
    const step = this.salesChartData.length > 1 ? width / (this.salesChartData.length - 1) : width;
    const maxRevenue = this.maxRevenue;
    
    return this.salesChartData.map((point, i) => {
      const cx = i * step;
      const cy = height - (point.revenue / maxRevenue) * (height - 20);
      return { cx, cy };
    });
  }

  getConicGradient(): string {
    let cumulative = 0;
    const parts = this.statusDistribution.map(s => {
      const start = cumulative;
      cumulative += s.percent;
      return `${s.color} ${start}% ${cumulative}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  getFinanceIncome(): number {
    const incomeStr = this.financeData.summaryCards[0]?.value || '0 ₽';
    const income = parseInt(incomeStr.replace(/[^0-9]/g, ''), 10) || 0;
    return Math.round(income / 1000);
  }

  getFinanceExpense(): number {
    const expenseStr = this.financeData.summaryCards[1]?.value || '0 ₽';
    const expense = parseInt(expenseStr.replace(/[^0-9]/g, ''), 10) || 0;
    return Math.round(expense / 1000);
  }

  getFinanceExpensePercent(): number {
    const incomeStr = this.financeData.summaryCards[0]?.value || '0 ₽';
    const expenseStr = this.financeData.summaryCards[1]?.value || '0 ₽';
    const income = parseInt(incomeStr.replace(/[^0-9]/g, ''), 10) || 1;
    const expense = parseInt(expenseStr.replace(/[^0-9]/g, ''), 10) || 0;
    return Math.min((expense / income) * 100, 100);
  }

  async exportReport(format: string): Promise<void> {
    if (format === 'pdf') {
      await this.exportToPDF();
    } else if (format === 'excel') {
      this.exportToExcel();
    } else {
      alert(`Экспорт отчёта в формате ${format.toUpperCase()} пока не реализован`);
    }
  }

  private async exportToPDF(): Promise<void> {
    this.isExporting = true;
    
    try {
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '1200px';
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.padding = '40px';
      exportContainer.style.fontFamily = "'Inter', system-ui, sans-serif";
      
      const titleHtml = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #09090b; padding-bottom: 20px;">
          <h1 style="font-size: 28px; margin: 0; color: #09090b;">${this.activeData.title}</h1>
          <p style="color: #71717a; margin-top: 10px;">
            Период: ${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}
          </p>
          <p style="color: #71717a; font-size: 12px;">
            Дата формирования: ${new Date().toLocaleString()}
          </p>
        </div>
      `;
      
      const cardsHtml = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px;">
          ${this.activeData.summaryCards.map(card => `
            <div style="border: 1px solid #e4e4e7; border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 13px; color: #71717a;">${card.label}</div>
              <div style="font-size: 28px; font-weight: 700; color: #09090b; margin: 8px 0;">${card.value}</div>
              <div style="font-size: 12px; color: #71717a;">${card.change}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      let tableHtml = '';
      if (this.activeData.tableRows.length > 0) {
        tableHtml = `
          <div style="margin-top: 30px;">
            <h3 style="font-size: 18px; margin-bottom: 16px;">Детальные данные</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f4f4f5;">
                  ${this.activeData.tableHeaders.map(header => `
                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e4e4e7; font-size: 12px; text-transform: uppercase; color: #71717a;">${header}</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${this.activeData.tableRows.slice(0, 20).map(row => `
                  <tr>
                    ${row.map(cell => `
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; font-size: 13px;">${cell}</td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${this.activeData.tableRows.length > 20 ? '<p style="margin-top: 12px; color: #71717a; font-size: 12px;">* Показаны первые 20 записей</p>' : ''}
          </div>
        `;
      }
      
      exportContainer.innerHTML = titleHtml + cardsHtml + tableHtml;
      document.body.appendChild(exportContainer);
      
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${this.activeData.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, '_')}_${this.dateFrom}_${this.dateTo}.pdf`);
      
      document.body.removeChild(exportContainer);
      
    } catch (error) {
      console.error('Ошибка при экспорте PDF:', error);
      alert('Произошла ошибка при создании PDF. Попробуйте позже.');
    } finally {
      this.isExporting = false;
    }
  }

  private exportToExcel(): void {
    this.isExporting = true;
    
    try {
      const workbook = XLSX.utils.book_new();
      const infoData = [
        ['Сводный отчёт'],
        [`Период: ${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`],
        [`Дата формирования: ${new Date().toLocaleString()}`],
        [],
        ['Краткая статистика'],
        ['Показатель', 'Значение']
      ];
      this.activeData.summaryCards.forEach(card => {
        infoData.push([card.label, card.value]);
      });
      
      const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Информация');
      if (this.activeData.tableRows.length > 0) {
        const detailData = [
          this.activeData.tableHeaders,
          ...this.activeData.tableRows
        ];
        const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
        const colWidths = this.activeData.tableHeaders.map(() => ({ wch: 20 }));
        detailSheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Детальные данные');
      }
      const fileName = `${this.activeData.title.replace(/[^а-яА-Яa-zA-Z0-9]/g, '_')}_${this.dateFrom}_${this.dateTo}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Ошибка при экспорте Excel:', error);
      alert('Произошла ошибка при создании Excel файла. Попробуйте позже.');
    } finally {
      this.isExporting = false;
    }
  }

  private formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }
}