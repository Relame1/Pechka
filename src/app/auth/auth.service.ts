import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'baker' | 'client';
  email_verified_at?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at?: string;
  yandex_id?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = 'http://127.0.0.1:8000';

  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.currentUserSignal.set(JSON.parse(stored));
    }
    if (localStorage.getItem('token') && !stored) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSignal.set(user);
        },
        error: () => {
          localStorage.removeItem('token');
        }
      });
    }
    
    this.handleTokenFromUrl();
  }

  handleTokenFromUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      this.getCurrentUser().subscribe({
        next: (user) => {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSignal.set(user);
          window.history.replaceState({}, document.title, window.location.pathname);
        },
        error: (err) => {
          console.error('Ошибка получения пользователя:', err);
          localStorage.removeItem('token');
        }
      });
    }
  }
  login(username: string, password: string) {
    return this.http.post<{ success: boolean; user: User; token: string; message: string }>(
      `${this.baseUrl}/api/login`,
      { username, password }
    ).pipe(
      tap((res) => {
        if (res.success) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token);
          this.currentUserSignal.set(res.user);
        }
      })
    );
  }
  loginEmployee(login: string, password: string) {
    return this.http.post<{ success: boolean; user: User; token: string; message: string }>(
      `${this.baseUrl}/api/employee-login`,
      { login, password }
    ).pipe(
      tap((res) => {
        if (res.success) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token);
          this.currentUserSignal.set(res.user);
        }
      })
    );
  }

  getCurrentUser() {
    return this.http.get<User>(`${this.baseUrl}/api/user`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  }

  logout() {
    return this.http.post(`${this.baseUrl}/api/logout`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).pipe(
      tap(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.currentUserSignal.set(null);
      })
    );
  }

  getUserFromStorage(): User | null {
    return this.currentUserSignal();
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSignal() && !!localStorage.getItem('token');
  }

  hasRole(role: string | string[]): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  setRegisteredEmail(email: string): void {
    localStorage.setItem('pending_verification_email', email);
  }

  getRegisteredEmail(): string | null {
    return localStorage.getItem('pending_verification_email');
  }

  clearRegisteredEmail(): void {
    localStorage.removeItem('pending_verification_email');
  }
}