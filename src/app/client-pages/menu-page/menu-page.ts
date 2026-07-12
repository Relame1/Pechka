import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientHeaderComponent, ClientFooterComponent, ClientCartComponent, ClientChatComponent],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss'
})
export class MenuPage implements OnInit {
  private productService = inject(ProductService);
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';
  searchQuery: string = '';
  isLoading: boolean = true;
  
  ngOnInit(): void {
    this.loadProducts();
  }
  
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data.filter(p => p.in_stock && p.stock > 0);
        this.filteredProducts = [...this.products];
        this.categories = [...new Set(data.map(p => p.category))];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Ошибка загрузки товаров:', err);
        this.isLoading = false;
      }
    });
  }
  
  getProductImageUrl(product: Product): string {
    if (product.image_url) {
      return product.image_url;
    }
    if (product.image) {
      return `http://localhost:8000/storage/${product.image}`;
    }
    return '';
  }
  
  filterProducts(): void {
    if (this.selectedCategory === 'all') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p => p.category === this.selectedCategory);
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      this.filteredProducts = this.filteredProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
  }
  
  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filterProducts();
  }
  
  clearSearch(): void {
    this.searchQuery = '';
    this.filterProducts();
  }
  
  isNewProduct(product: Product): boolean {
    if (!product.created_at) return false;
    const created = new Date(product.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7;
  }
  
  getProductIcon(category: string): string {
    const icons: Record<string, string> = {
      'Хлеб': '🍞',
      'Выпечка': '🥐',
      'Кондитерские изделия': '🍰',
      'Слойки': '🥟',
      'Напитки': '☕'
    };
    return icons[category] || '🥖';
  }
  
  addToCart(product: Product, event: Event): void {
    const cartEvent = new CustomEvent('addToCart', { 
      detail: { product, quantity: 1 }
    });
    window.dispatchEvent(cartEvent);
    const btn = event.target as HTMLElement;
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Добавлено!';
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 1000);
  }
}