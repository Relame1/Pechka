# Pechka

Веб-приложение для автоматизации работы пекарни: управление товарами и ингредиентами, заказами, производством, продажами, сотрудниками, клиентами, отзывами и уведомлениями.

## Технологии

**Frontend**

- Angular 21
- TypeScript
- SCSS
- npm

**Backend**

- PHP 8.2+
- Laravel 12
- Laravel Sanctum
- Laravel Socialite
- MySQL
- Composer
- YooKassa SDK

## Структура проекта

```text
Pechka/
├── src/                 # Angular-приложение
├── public/              # Статические файлы frontend
├── backend/             # Laravel API
├── angular.json
├── package.json
└── README.md
```

## Требования для запуска

Перед запуском необходимо установить:

- Git;
- Node.js и npm;
- PHP 8.2 или новее;
- Composer;
- MySQL 8 или совместимую версию;
- PHP-расширения: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `curl`, `zip`.

Проверка установленных версий:

```bash
git --version
node --version
npm --version
php --version
composer --version
mysql --version
```

## Установка проекта

### 1. Клонирование репозитория

```bash
git clone https://github.com/Relame1/Pechka.git
cd Pechka
```

### 2. Настройка базы данных

Запустите MySQL и создайте пустую базу данных:

```sql
CREATE DATABASE pechka
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Можно использовать другое название базы, но тогда его необходимо указать в `backend/.env`.

### 3. Настройка backend

Перейдите в каталог backend:

```bash
cd backend
```

Установите PHP-зависимости:

```bash
composer install
```

Создайте локальный файл окружения:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS**

```bash
cp .env.example .env
```

Сгенерируйте ключ Laravel:

```bash
php artisan key:generate
```

Откройте `backend/.env` и настройте минимум следующие параметры:

```env
APP_NAME=Pechka
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

APP_LOCALE=ru
APP_FALLBACK_LOCALE=ru
APP_FAKER_LOCALE=ru_RU

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pechka
DB_USERNAME=root
DB_PASSWORD=ваш_пароль

SESSION_DRIVER=file
SESSION_DOMAIN=localhost

SANCTUM_STATEFUL_DOMAINS=localhost:4200,127.0.0.1:4200

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
```

Для регистрации с подтверждением электронной почты также настройте SMTP:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=ваш_email
MAIL_PASSWORD=пароль_приложения
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=ваш_email
MAIL_FROM_NAME="${APP_NAME}"
```

Для входа через Яндекс и оплаты через YooKassa потребуются собственные тестовые ключи:

```env
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
YANDEX_REDIRECT_URI=http://localhost:8000/api/auth/yandex/callback

YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_RETURN_URL=http://localhost:4200/client/payment-success
```

Примените миграции и добавьте демонстрационные данные:

```bash
php artisan migrate --seed
```

Создайте символическую ссылку для загружаемых файлов:

```bash
php artisan storage:link
```

Очистите кэш конфигурации:

```bash
php artisan optimize:clear
```

Запустите Laravel API:

```bash
php artisan serve
```

Backend будет доступен по адресу:

```text
http://localhost:8000
```

### 4. Настройка frontend

Откройте второй терминал и вернитесь в корневой каталог проекта:

```bash
cd Pechka
```

Установите зависимости:

```bash
npm install
```

Запустите Angular:

```bash
npm start
```

При отсутствии скрипта `start` используйте:

```bash
npx ng serve
```

Frontend будет доступен по адресу:

```text
http://localhost:4200
```

## Дополнительные процессы

Некоторые функции приложения используют очередь Laravel. Для их работы откройте отдельный терминал:

```bash
cd backend
php artisan queue:work
```

Для автоматического создания производственных задач из запланированных заказов откройте ещё один терминал:

```bash
cd backend
php artisan orders:create-tasks
```

Эта команда работает постоянно и проверяет заказы раз в минуту. Остановить её можно сочетанием `Ctrl+C`.

## Краткий порядок запуска после первой установки

Необходимо открыть несколько терминалов.

**Терминал 1 — backend**

```bash
cd backend
php artisan serve
```

**Терминал 2 — frontend**

```bash
npm start
```

или:

```bash
npx ng serve
```

**Терминал 3 — очередь, при необходимости**

```bash
cd backend
php artisan queue:work
```

**Терминал 4 — обработка запланированных заказов, при необходимости**

```bash
cd backend
php artisan orders:create-tasks
```

После запуска открыть:

```text
http://localhost:4200
```

## Возможные проблемы

### Ошибка подключения к базе данных

Проверьте, что MySQL запущен, база `pechka` создана, а параметры `DB_*` в `backend/.env` указаны правильно.

### Ошибка `could not find driver`

В PHP не включено расширение MySQL PDO. Включите `pdo_mysql` в `php.ini`, затем перезапустите терминал или веб-сервер.

### Ошибка CORS или запросы к API не проходят

Убедитесь, что:

- Laravel запущен на `http://localhost:8000`;
- Angular запущен на `http://localhost:4200`;
- в `.env` указан `SANCTUM_STATEFUL_DOMAINS=localhost:4200,127.0.0.1:4200`;
- после изменения `.env` выполнена команда `php artisan optimize:clear`.

### Не отображаются изображения товаров

Выполните:

```bash
cd backend
php artisan storage:link
```

### Изменения `.env` не применились

```bash
cd backend
php artisan optimize:clear
```

## Тестирование

Backend:

```bash
cd backend
php artisan test
```

Frontend:

```bash
npm test
```

## Сборка frontend

```bash
npm run build
```

Результат сборки будет находиться в каталоге `dist/`.
