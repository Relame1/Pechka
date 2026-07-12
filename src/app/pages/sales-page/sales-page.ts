import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { SaleService, Sale, SaleItem } from '../../data/services/sale.service';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-page.html',
  styleUrls: ['./sales-page.scss']
})
export class SalesPage implements OnInit {
  products: Product[] = [];
  sales: Sale[] = [];                       // история продаж
  cart: (SaleItem & { product_name: string; unit: string; total: number })[] = [];
  customerName = '';
  total = 0;

  selectedProductId: number | null = null;
  selectedQuantity = 1;
  productSearch = '';

  loading = false;
  successMessage = '';
  loadingHistory = false;

  constructor(
    private productService: ProductService,
    private saleService: SaleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadSalesHistory();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  loadSalesHistory(): void {
    this.loadingHistory = true;
    this.saleService.getAll().subscribe({
      next: (data) => {
        this.sales = data;
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingHistory = false;
      }
    });
  }

  get filteredProducts(): Product[] {
    if (!this.productSearch) return this.products;
    const query = this.productSearch.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.article.toLowerCase().includes(query)
    );
  }

  selectProduct(productId: number): void {
    this.selectedProductId = productId;
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.selectedQuantity = 1;
      this.productSearch = product.name;
    }
  }

  addToCart(): void {
    if (!this.selectedProductId) return;
    const product = this.products.find(p => p.id === this.selectedProductId);
    if (!product) return;
    if (this.selectedQuantity <= 0) {
      alert('Количество должно быть больше 0');
      return;
    }
    if (product.stock < this.selectedQuantity) {
      alert(`Недостаточно товара. Доступно: ${product.stock} ${product.unit}`);
      return;
    }

    const existingItem = this.cart.find(item => item.product_id === this.selectedProductId);
    if (existingItem) {
      existingItem.quantity += this.selectedQuantity;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      this.cart.push({
        product_id: product.id!,
        product_name: product.name,
        quantity: this.selectedQuantity,
        price: product.price,
        unit: product.unit,
        total: this.selectedQuantity * product.price
      });
    }
    this.updateTotal();
    this.selectedProductId = null;
    this.productSearch = '';
    this.selectedQuantity = 1;
    this.cdr.detectChanges();
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.updateTotal();
    this.cdr.detectChanges();
  }

  updateTotal(): void {
    this.total = this.cart.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  completeSale(): void {
    if (this.cart.length === 0) {
      alert('Добавьте товары в чек');
      return;
    }

    const saleData: Sale = {
      customer_name: this.customerName?.trim() ? this.customerName : null,
      items: this.cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    this.loading = true;
    this.cdr.detectChanges();

    this.saleService.create(saleData)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Продажа успешно оформлена!';
          this.cart = [];
          this.customerName = '';
          this.total = 0;
          this.loadProducts();          // обновить остатки
          this.loadSalesHistory();      // обновить историю
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.error || 'Не удалось оформить продажу');
        }
      });
  }
}