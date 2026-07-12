import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Order, OrdersSummary } from '../../data/interfaces/order.interface';
import { OrderService } from '../../data/services/order.service';
import { OrderDetailsModalComponent } from '../../common-ui/order-details-modal/order-details-modal';
import { OrderEditModalComponent } from '../../common-ui/order-edit-modal/order-edit-modal';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.html',
  styleUrls: ['./orders-page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    OrderDetailsModalComponent,
    OrderEditModalComponent,
  ],
})
export class OrdersPageComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  summary: OrdersSummary = {
    total_today: 0,
    new: 0,
    in_progress: 0,
    completed: 0,
    total_amount_today: 0
  };
  loading = true;
  loadingSummary = true;
  error: string | null = null;

  filterForm: FormGroup;
  skeletonRows = Array(5).fill(0);
  selectedOrder: Order | null = null;
  showModal = false;
  editOrderData: Order | null = null;
  showEditModal = false;
  isUpdatingOrder = false;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      delivery: [''],
      q: [''],
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.loadingSummary = true;
    
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = [...this.orders];
        this.loading = false;
        this.calculateSummary();
        this.loadingSummary = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки заказов:', err);
        this.error = 'Не удалось загрузить заказы';
        this.loading = false;
        this.loadingSummary = false;
        this.cdr.detectChanges();
      },
    });
  }

  private calculateSummary(): void {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = this.orders.filter((o) => {
      const dueDate = o.due_at?.slice(0, 10);
      const createdDate = o.created_at?.slice(0, 10);
      return dueDate === today || createdDate === today;
    });

    const totalAmountToday = todayOrders.reduce((sum, o) => {
      const amount = Number(o.amount) || 0;
      return sum + amount;
    }, 0);

    this.summary = {
      total_today: todayOrders.length,
      new: this.orders.filter((o) => o.status === 'Новый').length,
      in_progress: this.orders.filter(
        (o) => o.status === 'Готовится' || o.status === 'Доставляется'
      ).length,
      completed: this.orders.filter((o) => o.status === 'Завершён').length,
      total_amount_today: totalAmountToday,
    };
  }

  applyFilters(): void {
    const { status, delivery, q } = this.filterForm.value;
    const query = (q || '').toLowerCase().trim();

    this.filteredOrders = this.orders.filter((order) => {
      const matchStatus = !status || order.status === status;
      const matchDelivery = !delivery || order.delivery_type === delivery;

      const matchSearch =
        !query ||
        (order.code || '').toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        (order.address || '').toLowerCase().includes(query);

      return matchStatus && matchDelivery && matchSearch;
    });
  }
  editOrder(order: Order): void {
    this.openEditModal(order);
  }

  openEditModal(order: Order): void {
    this.editOrderData = { ...order };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editOrderData = null;
    this.isUpdatingOrder = false;
    this.cdr.detectChanges();
  }

  updateOrder(orderData: any): void {
    if (!this.editOrderData) return;
    this.isUpdatingOrder = true;

    this.orderService.update(this.editOrderData.id, orderData).subscribe({
      next: () => {
        this.loadOrders();
        this.closeEditModal();
        alert('Заказ успешно обновлён');
      },
      error: (err) => {
        console.error(err);
        alert('Не удалось обновить заказ');
        this.isUpdatingOrder = false;
      },
    });
  }
  openOrderDetails(order: Order): void {
    this.orderService.getById(order.id).subscribe({
      next: (fullOrder) => {
        this.selectedOrder = fullOrder;
        this.showModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки деталей заказа', err);
        alert('Не удалось загрузить детали заказа');
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedOrder = null;
    this.cdr.detectChanges();
  }
  completeOrder(order: Order): void {
    if (!confirm('Завершить этот заказ?')) return;

    this.orderService.update(order.id, { status: 'Завершён' }).subscribe({
      next: () => {
        this.loadOrders();
        this.closeModal();
      },
      error: (err) => alert('Не удалось завершить заказ')
    });
  }
  deleteOrderFromModal(order: Order): void {
    if (!confirm('Удалить этот заказ?')) return;
    
    this.orderService.delete(order.id).subscribe({
      next: () => {
        this.loadOrders();
        this.closeModal();
        alert('Заказ успешно удалён');
      },
      error: (err) => {
        console.error('Ошибка удаления:', err);
        alert('Не удалось удалить заказ');
      }
    });
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

  randomWidth(index: number): number {
    const widths = [80, 90, 70, 60, 85, 95, 65, 75, 50];
    return widths[index % widths.length];
  }

  retryLoad(): void {
    this.error = null;
    this.loadOrders();
  }
}