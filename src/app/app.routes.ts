import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { Layout } from './common-ui/layout/layout';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { OrdersPageComponent } from './pages/orders-page/orders-page';
import { ProductionPage } from './pages/production-page/production-page';
import { WarehousePage } from './pages/warehouse-page/warehouse-page';
import { ProductsPage } from './pages/products-page/products-page';
import { CustomersPage } from './pages/customers-page/customers-page';
import { StatisticsPage } from './pages/statistics-page/statistics-page';
import { ReportsPage } from './pages/reports-page/reports-page';
import { AddProductPage } from './functions-pages/add-product-page/add-product-page';
import { AddIngredientPage } from './functions-pages/add-ingredient-page/add-ingredient-page';
import { AddOrderPage } from './functions-pages/add-order-page/add-order-page';
import { Production2Page } from './pages/production2-page/production2-page';
import { OvensPage } from './pages/ovens-page/ovens-page';
import { BakingLogPage } from './pages/baking-log-page/baking-log-page';
import { NotificationsPage } from './pages/notifications-page/notifications-page';
import { SalesPage } from './pages/sales-page/sales-page';
import { ClientHomePage } from './client-pages/client-home-page/client-home-page';
import { AboutPage } from './client-pages/about-page/about-page';
import { authGuard, roleGuard } from './auth/auth.guard';
import { MenuPage } from './client-pages/menu-page/menu-page';
import { AdvantagesPage } from './client-pages/advantages-page/advantages-page';
import { ReviewsPage } from './client-pages/reviews-page/reviews-page';
import { ContactsPage } from './client-pages/contacts-page/contacts-page';
import { EmployeesPage } from './pages/employees-page/employees-page';
import { ClientOrdersPage } from './client-pages/client-orders-page/client-orders-page';
import { VerifyEmailPage } from './common-ui-client/verify-email-page/verify-email-page';
import { ClientProfilePage } from './client-pages/client-profile-page/client-profile-page';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfilePage }, // Это для админ-панели
      { path: 'dashboard', component: DashboardPage, canActivate: [roleGuard(['admin', 'manager'])] },
      { path: 'employees', component: EmployeesPage, canActivate: [roleGuard(['admin'])] },
      { path: 'orders/new', component: AddOrderPage, canActivate: [roleGuard(['admin', 'manager'])] },
      { path: 'orders', component: OrdersPageComponent, canActivate: [roleGuard(['admin', 'manager'])] },
      { path: 'production', component: ProductionPage, canActivate: [roleGuard(['manager'])] },
      { path: 'production2', component: Production2Page, canActivate: [roleGuard(['baker'])] },
      { path: 'ovens', component: OvensPage, canActivate: [roleGuard(['baker'])] },
      { path: 'baking-log', component: BakingLogPage, canActivate: [roleGuard(['baker'])] },
      { path: 'notifications', component: NotificationsPage, canActivate: [roleGuard(['admin', 'manager', 'baker'])] },
      { path: 'warehouse', component: WarehousePage, canActivate: [roleGuard(['manager'])] },
      { path: 'products', component: ProductsPage, canActivate: [roleGuard(['manager'])] },
      { path: 'products/new', component: AddProductPage, canActivate: [roleGuard(['manager'])] },
      { path: 'warehouse/ingredient/new', component: AddIngredientPage, canActivate: [roleGuard(['manager'])] },
      { path: 'customers', component: CustomersPage, canActivate: [roleGuard(['admin', 'manager'])] },
      { path: 'statistics', component: StatisticsPage, canActivate: [roleGuard(['admin', 'manager'])] },
      { path: 'reports', component: ReportsPage, canActivate: [roleGuard(['admin', 'manager'])] },
      { path: 'sales', component: SalesPage, canActivate: [roleGuard(['manager'])] },
    ]
  },
  { path: 'login', component: LoginPage },
  { path: 'verify-email', component: VerifyEmailPage },
  { path: 'client', component: ClientHomePage },
  { path: 'client/profile', component: ClientProfilePage }, // ← ДОБАВЬТЕ ЭТУ СТРОКУ
  { path: 'about', component: AboutPage },
  { path: 'menu', component: MenuPage },
  { path: 'advantages', component: AdvantagesPage },
  { path: 'reviews', component: ReviewsPage },
  { path: 'contacts', component: ContactsPage },
  { path: 'client/orders', component: ClientOrdersPage }
];