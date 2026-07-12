import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { ProductService } from '../../data/services/product.service';
import { Product } from '../../data/interfaces/product.interface';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-client-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ClientHeaderComponent, ClientFooterComponent, ClientCartComponent, ClientChatComponent],
  templateUrl: './client-home-page.html',
  styleUrl: './client-home-page.scss'
})
export class ClientHomePage implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = ['Все'];
  selectedCategory: string = 'Все';
  isLoading: boolean = true;
  slides: string[] = [
    '/assets/imgs/slide1.jpg',
    '/assets/imgs/slide2.jpg',
    '/assets/imgs/slide3.jpg',
    '/assets/imgs/slide4.jpg'
  ];
  currentSlideIndex: number = 0;
  slideInterval: any;
  aboutImage1: string = '/assets/imgs/img1.jpg';
  aboutImage2: string = '/assets/imgs/img2.jpg';
  
  contactName: string = '';
  contactEmail: string = '';
  contactMessage: string = '';
  
  reviews = [
    { name: 'Анна', text: 'Очень вкусная выпечка! Заказываю уже второй раз, всегда свежее и ароматное.', date: '15.05.2024' },
    { name: 'Михаил', text: 'Лучшая пекарня в городе! Круассаны просто тают во рту.', date: '10.05.2024' },
    { name: 'Елена', text: 'Быстрая доставка, вежливые курьеры. Обязательно закажу ещё!', date: '05.05.2024' }
  ];
  
  visibleReviews = this.reviews.slice(0, 2);
  reviewIndex = 0;
  
  ngOnInit(): void {
    this.loadProducts();
    this.startSlideShow();
  }
  
  ngOnDestroy(): void {
    this.stopSlideShow();
  }
  
  startSlideShow(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }
  
  stopSlideShow(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
  
  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
  }
  
  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
  }
  
  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.stopSlideShow();
    this.startSlideShow();
  }
  
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data.filter(p => p.in_stock && p.stock > 0);
        this.filteredProducts = [...this.products];
        this.categories = ['Все', ...new Set(data.map(p => p.category))];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Ошибка загрузки товаров:', err);
        this.isLoading = false;
      }
    });
  }
  
  selectCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'Все') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p => p.category === category);
    }
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
      'Слойки': '🥟'
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
  
  prevReview(): void {
    this.reviewIndex = Math.max(0, this.reviewIndex - 1);
    this.visibleReviews = this.reviews.slice(this.reviewIndex, this.reviewIndex + 2);
  }
  
  nextReview(): void {
    this.reviewIndex = Math.min(this.reviews.length - 2, this.reviewIndex + 1);
    this.visibleReviews = this.reviews.slice(this.reviewIndex, this.reviewIndex + 2);
  }
  
  sendContact(): void {
    alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
    this.contactName = '';
    this.contactEmail = '';
    this.contactMessage = '';
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
}