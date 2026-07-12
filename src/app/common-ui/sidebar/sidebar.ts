import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  
  userRole: string | null = null;
  userName: string | null = null;

  ngOnInit(): void {
    this.updateUserData();
    this.router.events.subscribe(() => {
      this.updateUserData();
    });
  }

  updateUserData(): void {
    const user = this.authService.getUserFromStorage();
    this.userRole = user?.role || null;
    this.userName = user?.name || null;
  }

  getUserName(): string {
    return this.userName || 'Пользователь';
  }

  getUserInitial(): string {
    return this.userName?.charAt(0)?.toUpperCase() || 'П';
  }

  getRoleLabel(): string {
    switch (this.userRole) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'baker': return 'Пекарь';
      default: return 'Пользователь';
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Ошибка выхода:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    });
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isManager(): boolean {
    return this.userRole === 'manager';
  }

  isBaker(): boolean {
    return this.userRole === 'baker';
  }
}