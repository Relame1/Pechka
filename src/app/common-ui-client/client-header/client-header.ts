import { Component, HostListener, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-client-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-header.html',
  styleUrls: ['./client-header.scss']
})
export class ClientHeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  isScrolled: boolean = false;
  mobileMenuOpen: boolean = false;
  profileMenuOpen: boolean = false;
  cartItemCount: number = 0;
  
  private cartUpdateListener: (() => void) | null = null;
  private cartCountListener: (() => void) | null = null;
  
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.profileMenuOpen = false;
    }
  }
  
  ngOnInit(): void {
    this.updateCartCount();
    this.cartUpdateListener = () => {
      this.updateCartCount();
    };
    window.addEventListener('cartUpdated', this.cartUpdateListener);
    this.cartCountListener = () => {
      this.updateCartCount();
    };
    window.addEventListener('cartCountUpdated', this.cartCountListener);
    window.addEventListener('storage', (event) => {
      if (event.key === 'user' || event.key === 'token') {
        this.cdr.detectChanges();
        this.updateCartCount();
      }
    });
    this.cdr.detectChanges();
  }
  
  ngOnDestroy(): void {
    if (this.cartUpdateListener) {
      window.removeEventListener('cartUpdated', this.cartUpdateListener);
    }
    if (this.cartCountListener) {
      window.removeEventListener('cartCountUpdated', this.cartCountListener);
    }
  }
  
  updateCartCount(): void {
    const count = localStorage.getItem('cart_count');
    this.cartItemCount = count ? parseInt(count, 10) : 0;
  }
  
  get isAuthenticated(): boolean {
    const isAuth = this.authService.isAuthenticated();
    return isAuth;
  }
  
  getUserName(): string {
    const user = this.authService.getUserFromStorage();
    return user?.name || 'Гость';
  }
  
  getUserEmail(): string {
    const user = this.authService.getUserFromStorage();
    return user?.email || '';
  }
  
  getUserInitial(): string {
    const name = this.getUserName();
    return name.charAt(0).toUpperCase();
  }
  
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  
  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }
  
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('cart_count');
        window.dispatchEvent(new Event('cartCountUpdated'));
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Ошибка выхода:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('cart_count');
        this.router.navigate(['/login']);
      }
    });
  }
  
  toggleCart(): void {
    const event = new CustomEvent('toggleCart');
    window.dispatchEvent(event);
  }
}