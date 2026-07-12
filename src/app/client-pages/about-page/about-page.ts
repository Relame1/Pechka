import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, ClientHeaderComponent, ClientFooterComponent, ClientCartComponent, ClientChatComponent],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss'
})
export class AboutPage {
  teamMembers = [
    { name: 'Алексей Петров', position: 'Шеф-пекарь', experience: '15 лет', icon: '👨‍🍳', description: 'Мастер своего дела, создатель уникальных рецептов' },
    { name: 'Елена Смирнова', position: 'Кондитер', experience: '10 лет', icon: '👩‍🍳', description: 'Специалист по десертам и тортам' },
    { name: 'Михаил Иванов', position: 'Технолог', experience: '8 лет', icon: '👨‍🔬', description: 'Контролирует качество и свежесть продуктов' },
    { name: 'Анна Козлова', position: 'Менеджер', experience: '7 лет', icon: '👩‍💼', description: 'Отвечает за обслуживание клиентов' }
  ];
  
  milestones = [
    { year: '2014', title: 'Основание', description: 'Открытие первой пекарни' },
    { year: '2016', title: 'Расширение', description: 'Открытие второй пекарни' },
    { year: '2018', title: 'Доставка', description: 'Запуск собственной доставки' },
    { year: '2020', title: 'Онлайн', description: 'Запуск интернет-магазина' },
    { year: '2022', title: 'Награда', description: 'Лучшая пекарня года' },
    { year: '2024', title: '10 лет', description: 'Юбилей компании' }
  ];
  
  values = [
    { title: 'Качество', description: 'Используем только лучшие ингредиенты', icon: '⭐' },
    { title: 'Свежесть', description: 'Печём каждое утро с 4 часов', icon: '🌅' },
    { title: 'Любовь', description: 'Вкладываем душу в каждую булочку', icon: '❤️' },
    { title: 'Забота', description: 'Индивидуальный подход к каждому', icon: '🤝' }
  ];
}