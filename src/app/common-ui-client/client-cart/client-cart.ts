import { Component, OnInit, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../data/services/product.service';
import { OrderService } from '../../data/services/order.service';
import { AuthService } from '../../auth/auth.service';
import { Product } from '../../data/interfaces/product.interface';

@Component({
  selector: 'app-client-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-cart.html',
  styleUrls: ['./client-cart.scss']
})
export class ClientCartComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  
  cart: { product: Product; quantity: number }[] = [];
  showCart: boolean = false;
  isSubmittingOrder: boolean = false;
  orderSuccess: boolean = false;
  customerName: string = '';
  customerPhone: string = '';
  deliveryAddress: string = '';
  deliveryType: 'Доставка' | 'Самовывоз' = 'Самовывоз';
  deliveryDate: string = '';
  comment: string = '';
  
  private cartUpdateListener: any;
  private addToCartListener: any;
  private currentUserId: number | null = null;
  
  ngOnInit(): void {
    this.setupListeners();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.deliveryDate = tomorrow.toISOString().slice(0, 16);
    this.loadCartForCurrentUser();
    this.loadUserProfileData();
    window.addEventListener('storage', () => {
      this.loadUserProfileData();
      this.loadCartForCurrentUser();
    });
  }
  
  ngOnDestroy(): void {
    if (this.cartUpdateListener) {
      window.removeEventListener('cartUpdated', this.cartUpdateListener);
    }
    if (this.addToCartListener) {
      window.removeEventListener('addToCart', this.addToCartListener);
    }
    window.removeEventListener('storage', () => {});
  }
  
  private setupListeners(): void {
    window.addEventListener('toggleCart', () => {
      this.toggleCart();
      this.loadUserProfileData();
    });
    this.cartUpdateListener = () => {
      this.loadCartForCurrentUser();
    };
    window.addEventListener('cartUpdated', this.cartUpdateListener);
    this.addToCartListener = ((event: CustomEvent) => {
      const { product, quantity } = event.detail;
      this.addToCart(product, quantity);
    }) as EventListener;
    window.addEventListener('addToCart', this.addToCartListener);
    window.addEventListener('logout', () => {
      this.clearCart();
    });
  }
  private getCartStorageKey(): string {
    const user = this.authService.getUserFromStorage();
    if (user && user.id) {
      return `client_cart_user_${user.id}`;
    }
    return 'client_cart_guest';
  }
  loadCartForCurrentUser(): void {
    const userId = this.authService.getUserFromStorage()?.id;
    if (this.currentUserId !== userId) {
      this.currentUserId = userId || null;
      this.loadCartFromStorage();
    }
  }
  
  loadCartFromStorage(): void {
    const key = this.getCartStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      this.cart = JSON.parse(saved);
    } else {
      this.cart = [];
    }
    this.updateCartCount();
  }
  
  saveCartToStorage(): void {
    const key = this.getCartStorageKey();
    localStorage.setItem(key, JSON.stringify(this.cart));
    window.dispatchEvent(new Event('cartUpdated'));
    this.updateCartCount();
  }
  updateCartCount(): void {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem('cart_count', count.toString());
    window.dispatchEvent(new Event('cartCountUpdated'));
  }
  
  clearCart(): void {
    this.cart = [];
    this.saveCartToStorage();
  }
  
  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.saveCartToStorage();
  }
  
  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(index);
    } else {
      this.cart[index].quantity = quantity;
      this.saveCartToStorage();
    }
  }
  
  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }
  
  getCartItemCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().slice(0, 16);
  }
  
  toggleCart(): void {
    this.showCart = !this.showCart;
    if (!this.showCart) {
      this.orderSuccess = false;
    } else {
      this.loadUserProfileData();
    }
  }
  
  closeCart(): void {
    this.showCart = false;
    this.close.emit();
  }
  loadUserProfileData(): void {
    if (this.isAuthenticated) {
      const user = this.authService.getUserFromStorage();
      if (user) {
        if (user.name && !this.customerName) {
          this.customerName = user.name;
        }
        if ((user as any).phone && !this.customerPhone) {
          this.customerPhone = (user as any).phone;
        }
        if ((user as any).address && !this.deliveryAddress) {
          this.deliveryAddress = (user as any).address;
          if ((user as any).address) {
            this.deliveryType = 'Доставка';
          }
        }
      }
    }
  }
  
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
  
  addToCart(product: Product, quantity: number = 1): void {
    const existingItem = this.cart.find(item => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({ product, quantity });
    }
    this.saveCartToStorage();
    console.log(`Товар "${product.name}" добавлен в корзину`);
  }
  
  submitOrder(): void {
    if (!this.customerName.trim()) {
      alert('Пожалуйста, укажите ваше имя');
      return;
    }
    if (this.deliveryType === 'Доставка' && !this.deliveryAddress.trim()) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    if (!this.deliveryDate) {
      alert('Пожалуйста, укажите дату и время');
      return;
    }
    
    let customerEmail = null;
    if (this.isAuthenticated) {
      const user = this.authService.getUserFromStorage();
      if (user) {
        customerEmail = user.email;
      }
    }
    
    const orderData = {
      customer_name: this.customerName,
      customer_phone: this.customerPhone || null,
      customer_email: customerEmail,
      address: this.deliveryType === 'Доставка' ? this.deliveryAddress : null,
      delivery_type: this.deliveryType,
      due_at: new Date(this.deliveryDate).toISOString(),
      comment: this.comment || null,
      source: 'Сайт клиента',
      items: this.cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity
      }))
    };
    
    this.isSubmittingOrder = true;
    
    this.orderService.create(orderData).subscribe({
      next: (response: any) => {
        this.isSubmittingOrder = false;
        
        if (response.payment_url) {
          window.location.href = response.payment_url;
        } else {
          this.orderSuccess = true;
          this.cart = [];
          this.saveCartToStorage();
          
          setTimeout(() => {
            this.orderSuccess = false;
            this.closeCart();
          }, 2000);
        }
      },
      error: (err) => {
        this.isSubmittingOrder = false;
        console.error(err);
        alert('Ошибка при создании заказа: ' + (err.error?.message || 'Неизвестная ошибка'));
      }
    });
  }
}