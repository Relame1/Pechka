import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer, CustomerStats } from '../../data/services/customer.service';

@Component({
  selector: 'app-customers-page',
  templateUrl: './customers-page.html',
  styleUrls: ['./customers-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class CustomersPage implements OnInit {
  loading = true;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchQuery = '';
  
  stats: CustomerStats = {
    total: 0,
    activeThisMonth: 0,
    newThisMonth: 0,
    avgCheck: 0
  };

  skeletonRows = Array(5).fill(0);

  constructor(
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    Promise.all([
      this.customerService.getAll().toPromise(),
      this.customerService.getStats().toPromise()
    ]).then(([customers, stats]) => {
      this.customers = customers || [];
      this.filteredCustomers = [...this.customers];
      this.stats = stats || {
        total: 0,
        activeThisMonth: 0,
        newThisMonth: 0,
        avgCheck: 0
      };
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Ошибка загрузки данных клиентов:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  get filteredCustomersList(): Customer[] {
    if (!this.searchQuery) return this.filteredCustomers;
    const q = this.searchQuery.toLowerCase();
    return this.filteredCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }

  onSearchChange(): void {
    this.cdr.detectChanges();
  }
}