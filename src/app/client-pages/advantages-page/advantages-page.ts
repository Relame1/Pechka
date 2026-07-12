import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientHeaderComponent } from '../../common-ui-client/client-header/client-header';
import { ClientFooterComponent } from '../../common-ui-client/client-footer/client-footer';
import { ClientCartComponent } from '../../common-ui-client/client-cart/client-cart';
import { ClientChatComponent } from '../../common-ui-client/client-chat/client-chat';

@Component({
  selector: 'app-advantages-page',
  standalone: true,
  imports: [CommonModule, ClientHeaderComponent, ClientFooterComponent, ClientCartComponent, ClientChatComponent],
  templateUrl: './advantages-page.html',
  styleUrl: './advantages-page.scss'
})
export class AdvantagesPage {
  advantages = [
    {
      icon: '🌾',
      title: 'Натуральные ингредиенты',
      description: 'Используем только свежие, натуральные продукты без консервантов и усилителей вкуса. Мука высшего сорта, свежие яйца, натуральное масло.',
      details: 'Все ингредиенты проходят строгий контроль качества'
    },
    {
      icon: '👨‍🍳',
      title: 'Ручная работа',
      description: 'Каждое изделие лепится вручную нашими опытными пекарями с любовью и вниманием к деталям.',
      details: 'Сохраняем традиционные рецепты и технологии'
    },
    {
      icon: '🔥',
      title: 'Свежая выпечка',
      description: 'Печём каждое утро с 4 часов. Вы всегда получаете горячую, ароматную выпечку только что из печи.',
      details: 'Выпекаем небольшими партиями для максимальной свежести'
    },
    {
      icon: '🚚',
      title: 'Быстрая доставка',
      description: 'Доставим ваш заказ горячим в течение часа. Бесплатная доставка при заказе от 1000 ₽.',
      details: 'Собственная служба доставки с термосумками'
    },
    {
      icon: '💯',
      title: 'Гарантия качества',
      description: 'Если вам не понравится наша выпечка, мы вернём деньги или заменим заказ.',
      details: '100% гарантия свежести и вкуса'
    },
    {
      icon: '📱',
      title: 'Удобный заказ',
      description: 'Заказывайте онлайн через сайт или мобильное приложение за пару кликов.',
      details: 'Личный кабинет, история заказов, бонусная программа'
    },
    {
      icon: '🎁',
      title: 'Бонусная программа',
      description: 'Копите бонусы с каждого заказа и получайте скидки до 20% на следующую покупку.',
      details: '1 бонус = 1 ₽, начисляем 5% от суммы заказа'
    },
    {
      icon: '🏆',
      title: 'Награды и признание',
      description: 'Лучшая пекарня 2022 и 2023 года по версии городского журнала "Вкусный выбор".',
      details: 'Рекомендованы шеф-поварами ресторанов'
    }
  ];
  
  stats = [
    { number: '10+', label: 'лет опыта' },
    { number: '50+', label: 'видов выпечки' },
    { number: '5000+', label: 'довольных клиентов' },
    { number: '5', label: 'точек в городе' },
    { number: '100%', label: 'натуральных продуктов' },
    { number: '24/7', label: 'поддержка клиентов' }
  ];
}