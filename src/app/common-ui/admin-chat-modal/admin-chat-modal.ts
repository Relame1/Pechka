import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

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

export interface ChatConversation {
  userEmail: string;
  userName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  messages?: ChatMessage[];
}

@Component({
  selector: 'app-admin-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-chat-modal.html',
  styleUrls: ['./admin-chat-modal.scss']
})
export class AdminChatModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible: boolean = false;
  @Input() conversation: ChatConversation | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<void>();
  @Output() conversationDeleted = new EventEmitter<void>();
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  replyMessage: string = '';
  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  isDeleting: boolean = false;
  
  ngOnInit(): void {
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible === true && this.conversation) {
      console.log('Модальное окно открыто, загрузка сообщений для:', this.conversation.userEmail);
      this.loadMessages();
    }
    if (changes['conversation'] && this.conversation && this.visible) {
      console.log('Conversation изменился, загрузка сообщений для:', this.conversation.userEmail);
      this.loadMessages();
    }
  }
  
  ngOnDestroy(): void {
  }
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  loadMessages(): void {
    if (!this.conversation) {
      console.warn('Нет conversation для загрузки сообщений');
      return;
    }
    
    console.log('Загрузка сообщений для:', this.conversation.userEmail);
    this.isLoading = true;
    this.messages = []; // Очищаем старые сообщения
    
    this.http.get<ChatMessage[]>(`http://127.0.0.1:8000/api/chat/admin/messages/${encodeURIComponent(this.conversation.userEmail)}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (messages) => {
        console.log('Получены сообщения:', messages.length);
        this.messages = messages;
        this.isLoading = false;
        this.markMessagesAsRead();
        setTimeout(() => this.scrollToBottom(), 200);
      },
      error: (err) => {
        console.error('Ошибка загрузки сообщений:', err);
        this.isLoading = false;
      }
    });
  }
  
  markMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(m => 
      m.sender_type === 'client' && !m.is_read
    );
    
    if (unreadMessages.length === 0) return;
    
    const messageIds = unreadMessages.map(m => m.id);
    
    this.http.post('http://127.0.0.1:8000/api/chat/mark-read', 
      { message_ids: messageIds },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.messages.forEach(msg => {
          if (msg.sender_type === 'client' && !msg.is_read) {
            msg.is_read = true;
          }
        });
      },
      error: (err) => console.error('Ошибка отметки прочитанных:', err)
    });
  }
  
  deleteConversation(): void {
    if (!this.conversation) return;
    
    const confirmDelete = confirm(`Завершить переписку с ${this.conversation.userName}? Все сообщения будут удалены без возможности восстановления.`);
    
    if (!confirmDelete) return;
    
    this.isDeleting = true;
    
    this.http.delete(`http://127.0.0.1:8000/api/chat/conversation/${encodeURIComponent(this.conversation.userEmail)}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: any) => {
        console.log('Переписка удалена:', res);
        this.isDeleting = false;
        alert(`Переписка с ${this.conversation?.userName} завершена`);
        this.conversationDeleted.emit();
        this.onClose();
      },
      error: (err) => {
        console.error('Ошибка удаления переписки:', err);
        this.isDeleting = false;
        alert('Не удалось удалить переписку');
      }
    });
  }
  
  onEnterPress(): void {
    const event = window.event as KeyboardEvent;
    if (event && event.shiftKey) {
      return;
    }
    event?.preventDefault();
    this.sendReply();
  }
  
  sendReply(): void {
    if (!this.replyMessage.trim() || !this.conversation) return;
    
    this.isLoading = true;
    
    this.http.post('http://127.0.0.1:8000/api/chat/admin/send', 
      {
        user_email: this.conversation.userEmail,
        message: this.replyMessage.trim()
      },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messages.push(res.message);
          this.replyMessage = '';
          this.messageSent.emit();
          setTimeout(() => this.scrollToBottom(), 100);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Ошибка отправки:', err);
        this.isLoading = false;
        alert('Не удалось отправить сообщение');
      }
    });
  }
  
  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
  
  formatTime(dateStr: string): string {
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
  
  onClose(): void {
    this.close.emit();
  }
  
  isAdminMessage(msg: ChatMessage): boolean {
    return msg.sender_type === 'admin';
  }
}