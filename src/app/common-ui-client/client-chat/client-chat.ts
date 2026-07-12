
import { Component, HostListener, OnInit, OnDestroy, inject, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { finalize } from 'rxjs/operators';

export interface ChatMessage {
  id: number;
  user_id: number | null;
  user_name: string;
  user_email: string;
  message: string;
  sender_type: 'client' | 'admin';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

@Component({
  selector: 'app-client-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-chat.html',
  styleUrls: ['./client-chat.scss']
})
export class ClientChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  isOpen: boolean = false;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  unreadCount: number = 0;
  isLoading: boolean = false;
  isSending: boolean = false;
  private refreshInterval: any;
  
  ngOnInit(): void {
    this.checkUnreadCount();
    this.refreshInterval = setInterval(() => {
      if (this.isOpen) {
        this.loadMessages();
      } else {
        this.checkUnreadCount();
      }
    }, 10000);
  }
  
  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  loadMessages(): void {
    if (!this.authService.isAuthenticated()) {
      console.log('Пользователь не авторизован');
      this.isLoading = false;
      return;
    }
    if (this.isLoading) {
      console.log('Уже загружаем сообщения, пропускаем');
      return;
    }
    
    console.log('Загрузка сообщений клиента...');
    this.isLoading = true;
    
    this.http.get<ChatMessage[]>('http://127.0.0.1:8000/api/chat/messages', {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (messages) => {
        console.log('Получено сообщений:', messages?.length || 0);
        this.messages = messages || [];
        this.updateUnreadCount();
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Ошибка загрузки сообщений:', err);
        this.messages = [];
        this.cdr.detectChanges();
      }
    });
  }
  
  checkUnreadCount(): void {
    if (!this.authService.isAuthenticated()) return;
    
    this.http.get<ChatMessage[]>('http://127.0.0.1:8000/api/chat/messages', {
      headers: this.getHeaders()
    }).subscribe({
      next: (messages) => {
        const unread = (messages || []).filter(m => 
          m.sender_type === 'admin' && !m.is_read
        ).length;
        this.unreadCount = unread;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка проверки уведомлений:', err)
    });
  }
  
  updateUnreadCount(): void {
    this.unreadCount = (this.messages || []).filter(m => 
      m.sender_type === 'admin' && !m.is_read
    ).length;
    this.cdr.detectChanges();
  }
  
  markMessagesAsRead(): void {
    const unreadMessages = (this.messages || []).filter(m => 
      m.sender_type === 'admin' && !m.is_read
    );
    
    if (unreadMessages.length === 0) return;
    
    const messageIds = unreadMessages.map(m => m.id);
    
    this.http.post('http://127.0.0.1:8000/api/chat/mark-read', 
      { message_ids: messageIds },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.messages.forEach(msg => {
          if (msg.sender_type === 'admin' && !msg.is_read) {
            msg.is_read = true;
          }
        });
        this.updateUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка отметки прочитанных:', err)
    });
  }
  
  isMyMessage(msg: ChatMessage): boolean {
    const user = this.authService.getUserFromStorage();
    return msg.sender_type === 'client' && user?.email === msg.user_email;
  }
  
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      console.log('Открытие чата');
      this.loadMessages();
      setTimeout(() => {
        this.markMessagesAsRead();
      }, 500);
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }
  
  closeChat(): void {
    this.isOpen = false;
  }
  
  onEnterPress(): void {
    const event = window.event as KeyboardEvent;
    if (event && event.shiftKey) {
      return;
    }
    event?.preventDefault();
    this.sendMessage();
  }
  
  sendMessage(): void {
    const messageText = this.newMessage.trim();
    if (!messageText) return;
    if (this.isSending) return;
    
    const user = this.authService.getUserFromStorage();
    
    if (!user) {
      this.sendGuestMessage(messageText);
      return;
    }
    
    console.log('Отправка сообщения от клиента:', user.email);
    this.isSending = true;
    this.newMessage = '';
    this.cdr.detectChanges();
    
    this.http.post('http://127.0.0.1:8000/api/chat/send', 
      { message: messageText },
      { headers: this.getHeaders() }
    ).pipe(
      finalize(() => {
        this.isSending = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        console.log('Сообщение отправлено:', res);
        if (res.success && res.message) {
          this.messages.push(res.message);
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (err) => {
        console.error('Ошибка отправки:', err);
        this.newMessage = messageText;
        this.cdr.detectChanges();
        alert('Не удалось отправить сообщение');
      }
    });
  }
  
  sendGuestMessage(messageText: string): void {
    if (this.isSending) return;
    
    const guestName = prompt('Введите ваше имя для ответа:') || 'Гость';
    const guestEmail = prompt('Введите ваш email для ответа:') || `guest_${Date.now()}@example.com`;
    
    if (!guestName || !guestEmail) return;
    
    this.isSending = true;
    this.newMessage = '';
    this.cdr.detectChanges();
    
    this.http.post('http://127.0.0.1:8000/api/chat/guest-send', {
      name: guestName,
      email: guestEmail,
      message: messageText
    }).pipe(
      finalize(() => {
        this.isSending = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('Сообщение отправлено! Мы ответим вам на email.');
        }
      },
      error: (err) => {
        console.error('Ошибка отправки:', err);
        this.newMessage = messageText;
        this.cdr.detectChanges();
        alert('Не удалось отправить сообщение');
      }
    });
  }
  
  scrollToBottom(): void {
    if (this.messagesContainer && this.messagesContainer.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
  
  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
  }
}