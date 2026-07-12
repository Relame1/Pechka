import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { OrderService } from '../../data/services/order.service';
import { ClientOrder } from '../../data/interfaces/order.interface';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-client-orders-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ClientHeaderComponent, ClientFooterComponent, ClientChatComponent],
  templateUrl: './client-orders-page.html',
  styleUrl: './client-orders-page.scss'
})
export class ClientOrdersPage implements OnInit, OnDestroy {
  private orderService = inject(OrderService);

  orders: ClientOrder[] = [];
  isLoading = true;
  errorMessage = '';
  private refreshSubscription?: Subscription;

  ngOnInit(): void {
    this.loadOrders();
    this.refreshSubscription = interval(15000).subscribe(() => {
      this.loadOrdersSilently();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.fetchOrders();
  }

  loadOrdersSilently(): void {
    this.fetchOrders();
  }

  private fetchOrders(): void {
    this.orderService.getMyOrders().subscribe({
      next: (data: ClientOrder[]) => {
        console.log('📦 Загружены заказы клиента:', data);
        data.forEach((order, index) => {
          console.log(`Заказ #${index}:`, {
            id: order.id,
            status: order.status,
            payment_status: order.payment_status,
            'используемый статус': order.payment_status || order.status
          });
        });
        this.orders = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Ошибка загрузки заказов:', err);
        if (this.isLoading) {
          this.errorMessage = 'Не удалось загрузить заказы. Попробуйте позже.';
          this.isLoading = false;
        }
      }
    });
  }

  getStatusText(status: string | undefined): string {
    console.log('getStatusText called with:', status);
    
    if (!status) return 'Неизвестно';
    
    const map: { [key: string]: string } = {
      'pending_payment': 'Ожидает оплаты',
      'pending': 'В обработке',
      'confirmed': 'Подтверждён',
      'completed': 'Выполнен',
      'cancelled': 'Отменён',
      'Новый': 'Новый',
      'Готовится': 'Готовится',
      'Доставляется': 'Доставляется',
      'Завершён': 'Выполнен'
    };
    
    const result = map[status] || status;
    console.log('getStatusText result:', result);
    return result;
  }

  getStatusClass(status: string | undefined): string {
    console.log('getStatusClass called with:', status);
    
    if (!status) return 'status-processing';
    
    if (status === 'completed' || status === 'Завершён') {
      return 'status-completed';
    }
    if (status === 'pending_payment' || status === 'pending') {
      return 'status-pending';
    }
    if (status === 'cancelled' || status === 'Отменён') {
      return 'status-cancelled';
    }
    return 'status-processing';
  }

  repeatOrder(order: ClientOrder): void {
    alert(`Повтор заказа №${order.id} — функция в разработке`);
  }
}