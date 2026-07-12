import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';
import { ReviewService, Review, ReviewStats } from '../../data/services/review.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ClientHeaderComponent, ClientFooterComponent, ClientCartComponent, ClientChatComponent],
  templateUrl: './reviews-page.html',
  styleUrl: './reviews-page.scss'
})
export class ReviewsPage implements OnInit {
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  
  Math = Math;
  
  showReviewForm: boolean = false;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  
  newReview = {
    name: '',
    city: '',
    rating: 5,
    text: '',
    email: ''
  };
  
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  selectedRating: number = 0;
  searchQuery: string = '';
  stats: ReviewStats = {
    totalReviews: 0,
    averageRating: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0
  };
  
  ngOnInit(): void {
    this.loadReviews();
    this.loadStats();
    const user = this.authService.getUserFromStorage();
    if (user) {
      this.newReview.name = user.name;
      this.newReview.email = user.email || '';
    }
  }
  
  loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getAll().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.filteredReviews = [...this.reviews];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Ошибка загрузки отзывов:', err);
        this.isLoading = false;
      }
    });
  }
  
  loadStats(): void {
    this.reviewService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Ошибка загрузки статистики:', err);
      }
    });
  }
  
  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? '★' : '☆');
    }
    return stars;
  }
  
  getRatingPercent(rating: number): number {
    if (this.stats.totalReviews === 0) return 0;
    switch(rating) {
      case 5: return (this.stats.fiveStar / this.stats.totalReviews) * 100;
      case 4: return (this.stats.fourStar / this.stats.totalReviews) * 100;
      case 3: return (this.stats.threeStar / this.stats.totalReviews) * 100;
      case 2: return (this.stats.twoStar / this.stats.totalReviews) * 100;
      case 1: return (this.stats.oneStar / this.stats.totalReviews) * 100;
      default: return 0;
    }
  }
  
  getAverageRating(): string {
    return this.stats.averageRating.toFixed(1);
  }
  
  filterByRating(rating: number): void {
    if (this.selectedRating === rating) {
      this.selectedRating = 0;
      this.filteredReviews = [...this.reviews];
    } else {
      this.selectedRating = rating;
      this.filteredReviews = this.reviews.filter(r => r.rating === rating);
    }
    this.applySearch();
  }
  
  onSearchChange(): void {
    this.applySearch();
  }
  
  applySearch(): void {
    let result = [...this.reviews];
    
    if (this.selectedRating > 0) {
      result = result.filter(r => r.rating === this.selectedRating);
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.text.toLowerCase().includes(query) ||
        (r.city && r.city.toLowerCase().includes(query))
      );
    }
    
    this.filteredReviews = result;
  }
  
  resetFilters(): void {
    this.selectedRating = 0;
    this.searchQuery = '';
    this.filteredReviews = [...this.reviews];
  }
  
  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
  }
  
  submitReview(): void {
    if (!this.newReview.name.trim()) {
      alert('Пожалуйста, укажите ваше имя');
      return;
    }
    
    if (!this.newReview.text.trim()) {
      alert('Пожалуйста, напишите текст отзыва');
      return;
    }
    
    if (this.newReview.text.length < 10) {
      alert('Отзыв должен содержать минимум 10 символов');
      return;
    }
    
    this.isSubmitting = true;
    
    this.reviewService.create(this.newReview).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showReviewForm = false;
        if (res.review) {
          this.reviews.unshift(res.review);
          this.filteredReviews = [...this.reviews];
          this.loadStats(); // Обновляем статистику
        }
        
        alert('Спасибо за ваш отзыв!');
        this.newReview = {
          name: '',
          city: '',
          rating: 5,
          text: '',
          email: ''
        };
        const user = this.authService.getUserFromStorage();
        if (user) {
          this.newReview.name = user.name;
          this.newReview.email = user.email || '';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = err.error?.message || err.error?.errors?.text?.[0] || 'Не удалось отправить отзыв. Попробуйте позже.';
        alert(message);
      }
    });
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  
  getAvatarLetter(name: string): string {
    return name.charAt(0).toUpperCase();
  }
}