import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ClientHeaderComponent, ClientFooterComponent, ClientCartComponent, ClientChatComponent],
  templateUrl: './contacts-page.html',
  styleUrl: './contacts-page.scss'
})
export class ContactsPage {
  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  
  showSuccess: boolean = false;
  
  shops = [
    {
      name: 'Центральный магазин',
      address: 'г. Москва, ул. Хлебная, 15',
      phone: '+7 (999) 123-45-67',
      email: 'central@bakery.ru',
      hours: 'Пн-Вс: 8:00 - 21:00',
      coordinates: '55.751244, 37.618423',
      icon: '🏪'
    },
    {
      name: 'Северный филиал',
      address: 'г. Москва, ул. Пекарская, 42',
      phone: '+7 (999) 234-56-78',
      email: 'north@bakery.ru',
      hours: 'Пн-Вс: 9:00 - 20:00',
      coordinates: '55.794129, 37.546783',
      icon: '🏪'
    },
    {
      name: 'Южный филиал',
      address: 'г. Москва, ул. Свежая, 8',
      phone: '+7 (999) 345-67-89',
      email: 'south@bakery.ru',
      hours: 'Пн-Вс: 9:00 - 20:00',
      coordinates: '55.657572, 37.667453',
      icon: '🏪'
    }
  ];
  
  submitForm(): void {
    if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) {
      alert('Пожалуйста, заполните обязательные поля');
      return;
    }
    
    console.log('Отправка формы:', this.contactForm);
    
    this.showSuccess = true;
    this.contactForm = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
    
    setTimeout(() => {
      this.showSuccess = false;
    }, 5000);
  }
  
  openMap(coordinates: string): void {
    window.open(`https://maps.google.com/?q=${coordinates}`, '_blank');
  }
}