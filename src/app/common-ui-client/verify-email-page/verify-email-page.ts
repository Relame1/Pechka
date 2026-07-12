import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-email-page.html',
  styleUrls: ['./verify-email-page.scss']
})
export class VerifyEmailPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  
  email: string = '';
  code: string = '';
  isLoading: boolean = false;
  isResending: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  resendSuccess: boolean = false;
  
  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.router.navigate(['/login']);
    }
  }
  
  verifyCode(): void {
    if (!this.code || this.code.length !== 6) {
      this.errorMessage = 'Введите 6-значный код';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.post('http://127.0.0.1:8000/api/verify-email', {
      email: this.email,
      code: this.code
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.setItem('token', res.token);
          this.authService['currentUserSignal'].set(res.user);
          
          this.successMessage = res.message;
          setTimeout(() => {
            this.router.navigate(['/client']);
          }, 1500);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Неверный код подтверждения';
      }
    });
  }
  
  resendCode(): void {
    this.isResending = true;
    this.resendSuccess = false;
    this.errorMessage = '';
    
    this.http.post('http://127.0.0.1:8000/api/resend-verification', {
      email: this.email
    }).subscribe({
      next: (res: any) => {
        this.isResending = false;
        if (res.success) {
          this.resendSuccess = true;
          setTimeout(() => {
            this.resendSuccess = false;
          }, 3000);
        }
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err.error?.message || 'Не удалось отправить код';
      }
    });
  }
}