import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Production2Service, Notification } from '../../data/services/production2.service';
import { AdminChatModalComponent, ChatConversation } from '../../common-ui/admin-chat-modal/admin-chat-modal';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, AdminChatModalComponent],
  templateUrl: './notifications-page.html',
  styleUrls: ['./notifications-page.scss']
})
export class NotificationsPage implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = true;
  error = '';
  showChatModal: boolean = false;
  selectedConversation: ChatConversation | null = null;
  conversations: ChatConversation[] = [];
  
  private refreshInterval: any;

  constructor(
    private productionService: Production2Service,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadConversations();
    this.refreshInterval = setInterval(() => {
      this.loadConversations();
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

  loadNotifications(): void {
    this.loading = true;
    this.productionService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Ошибка загрузки уведомлений', err);
        this.error = 'Не удалось загрузить уведомления';
        this.loading = false;
      }
    });
  }
  
  loadConversations(): void {
    this.http.get<ChatConversation[]>('http://127.0.0.1:8000/api/chat/conversations', {
      headers: this.getHeaders()
    }).subscribe({
      next: (conversations) => {
        const currentUser = this.authService.getUserFromStorage();
        this.conversations = conversations.filter(conv => {
          if (conv.userEmail === currentUser?.email) return false;
          const excludeEmails = ['admin', 'manager', 'support', 'pechka.ru', 'example.com'];
          if (excludeEmails.some(exclude => conv.userEmail.includes(exclude))) return false;
          if (conv.userName === currentUser?.name) return false;
          
          return true;
        });
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Ошибка загрузки переписок:', err)
    });
  }
  
  openChatWithUser(conversation: ChatConversation): void {
    this.selectedConversation = conversation;
    this.showChatModal = true;
  }
  
  closeChatModal(): void {
    this.showChatModal = false;
    this.selectedConversation = null;
    this.loadConversations();
    this.cdr.detectChanges();
  }
  
  onConversationDeleted(): void {
    this.loadConversations();
    this.cdr.detectChanges();
  }

  markAsRead(notif: Notification): void {
    if (notif.read) return;
    
    this.productionService.markNotificationAsRead(notif.id).subscribe({
      next: () => {
        notif.read = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Ошибка отметки прочитанным', err)
    });
  }

  deleteNotification(id: number): void {
    if (!confirm('Удалить уведомление?')) return;
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.cdr.detectChanges();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'warning': return 'notif-warning';
      case 'error': return 'notif-error';
      case 'success': return 'notif-success';
      default: return 'notif-info';
    }
  }

  formatDate(dateValue?: string | Date): string {
    if (!dateValue) return '';
    let date: Date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    return date.toLocaleDateString('ru-RU');
  }
}