import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { AuthService, User } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { finalize, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-client-profile-page',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterLink,
    ClientHeaderComponent, 
    ClientFooterComponent, 
    ClientCartComponent,
    ClientChatComponent
  ],
  templateUrl: './client-profile-page.html',
  styleUrls: ['./client-profile-page.scss']
})
export class ClientProfilePage implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  user: User | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  
  profileForm!: FormGroup;
  
  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
  }
  
  initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/)]],
      address: [''],
      current_password: [''],
      new_password: ['', [Validators.minLength(6)]],
      confirm_password: ['']
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('new_password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }

  /**
   * Применяет маску телефона +7(XXX)-XXX-XX-XX
   */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Удаляем всё кроме цифр
    if (value.startsWith('8')) {
      value = '7' + value.slice(1);
    }
    if (value.startsWith('9')) {
      value = '7' + value;
    }
    value = value.slice(0, 11);
    let formattedValue = '';
    
    if (value.length > 0) {
      formattedValue = '+' + value[0]; // +7
    }
    if (value.length > 1) {
      formattedValue += '(' + value.slice(1, 4); // (906)
    }
    if (value.length > 4) {
      formattedValue += ')-' + value.slice(4, 7); // )-173
    }
    if (value.length > 7) {
      formattedValue += '-' + value.slice(7, 9); // -70
    }
    if (value.length > 9) {
      formattedValue += '-' + value.slice(9, 11); // -33
    }
    input.value = formattedValue;
    this.profileForm.get('phone')?.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * Очищает телефон от маски перед отправкой на сервер
   */
  private cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Форматирует телефон из БД в маску
   */
  private formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    
    let value = phone.replace(/\D/g, '');
    if (value.startsWith('8')) {
      value = '7' + value.slice(1);
    }
    if (value.startsWith('9')) {
      value = '7' + value;
    }
    
    value = value.slice(0, 11);
    
    let formattedValue = '';
    
    if (value.length > 0) {
      formattedValue = '+' + value[0];
    }
    if (value.length > 1) {
      formattedValue += '(' + value.slice(1, 4);
    }
    if (value.length > 4) {
      formattedValue += ')-' + value.slice(4, 7);
    }
    if (value.length > 7) {
      formattedValue += '-' + value.slice(7, 9);
    }
    if (value.length > 9) {
      formattedValue += '-' + value.slice(9, 11);
    }
    
    return formattedValue;
  }
  
  loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Не авторизован';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    const storedUser = this.authService.getUserFromStorage();
    if (storedUser) {
      this.user = storedUser;
      this.profileForm.patchValue({
        name: storedUser.name || '',
        email: storedUser.email || '',
        phone: this.formatPhoneForDisplay((storedUser as any).phone || ''),
        address: (storedUser as any).address || ''
      });
      this.isLoading = false;
      this.cdr.detectChanges();
    }
    
    this.http.get('http://127.0.0.1:8000/api/user', {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      timeout(10000),
      catchError((err) => {
        console.error('HTTP Error:', err);
        if (err.name === 'TimeoutError') {
          this.errorMessage = 'Превышено время ожидания ответа от сервера';
        } else if (err.status === 401) {
          this.errorMessage = 'Сессия истекла, войдите заново';
        } else {
          this.errorMessage = 'Не удалось загрузить данные профиля';
        }
        return of(null);
      })
    ).subscribe({
      next: (user: any) => {
        if (user) {
          this.user = user;
          this.profileForm.patchValue({
            name: user.name || '',
            email: user.email || '',
            phone: this.formatPhoneForDisplay(user.phone || ''),
            address: user.address || ''
          });
          
          const updatedUser = { ...this.authService.getUserFromStorage(), ...user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          this.authService['currentUserSignal'].set(updatedUser);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Subscribe error:', err);
        if (!this.errorMessage) {
          this.errorMessage = 'Не удалось загрузить данные профиля';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    const formData = this.profileForm.value;
    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone: this.cleanPhone(formData.phone), // Очищаем от маски перед отправкой
      address: formData.address
    };
    
    if (formData.new_password && formData.new_password.trim() !== '') {
      updateData.password = formData.new_password;
      updateData.password_confirmation = formData.confirm_password;
      updateData.current_password = formData.current_password;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Не авторизован';
      this.isSaving = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.http.put('http://127.0.0.1:8000/api/user/profile', updateData, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      timeout(10000),
      catchError((err) => {
        console.error('Update error:', err);
        if (err.error?.errors) {
          const errors = err.error.errors;
          const firstError = Object.values(errors)[0] as string[];
          this.errorMessage = firstError?.[0] || 'Ошибка при обновлении';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.name === 'TimeoutError') {
          this.errorMessage = 'Превышено время ожидания ответа от сервера';
        } else {
          this.errorMessage = 'Не удалось обновить профиль';
        }
        return of(null);
      }),
      finalize(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          setTimeout(() => {
            this.successMessage = 'Профиль успешно обновлён!';
            this.cdr.detectChanges();
          }, 0);
          
          if (response.user) {
            const updatedUser = { ...this.user, ...response.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.authService['currentUserSignal'].set(updatedUser);
            this.user = updatedUser;
            this.profileForm.patchValue({
              phone: this.formatPhoneForDisplay(response.user.phone || '')
            });
          }
          
          this.profileForm.patchValue({
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
          
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        }
        this.cdr.detectChanges();
      }
    });
  }
  
  cancelEdit(): void {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name || '',
        email: this.user.email || '',
        phone: this.formatPhoneForDisplay((this.user as any).phone || ''),
        address: (this.user as any).address || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.detectChanges();
    }
  }
  
  getInitials(): string {
    if (!this.user?.name) return 'П';
    const names = this.user.name.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return this.user.name.charAt(0).toUpperCase();
  }
  
  isEmailVerified(): boolean {
    return !!this.user?.email_verified_at;
  }
  
  isYandexUser(): boolean {
    return !!(this.user as any)?.yandex_id;
  }
}