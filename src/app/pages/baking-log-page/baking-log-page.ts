import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Production2Service, ProductionTask } from '../../data/services/production2.service';

@Component({
  selector: 'app-baking-log-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './baking-log-page.html',
  styleUrls: ['./baking-log-page.scss']
})
export class BakingLogPage implements OnInit {
  tasks: ProductionTask[] = [];
  filteredTasks: ProductionTask[] = [];
  loading = true;

  searchQuery = '';
  startDate = '';
  endDate = '';

  constructor(private productionService: Production2Service) {}

  ngOnInit(): void {
    this.loadLog();
  }

  loadLog(): void {
    this.loading = true;
    this.productionService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data.filter(task => task.status === 'completed');
        this.tasks = this.tasks.map(task => ({
          ...task,
          finishedAt: (task as any).finished_at || task.finishedAt,
          createdAt: (task as any).created_at || task.createdAt
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Ошибка загрузки журнала выпечки', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.tasks];
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.productName.toLowerCase().includes(query) ||
        t.orderCode.toLowerCase().includes(query)
      );
    }
    if (this.startDate) {
      const start = new Date(this.startDate);
      result = result.filter(t => {
        const date = t.finishedAt ? new Date(t.finishedAt) : new Date(t.createdAt || '');
        return date >= start;
      });
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => {
        const date = t.finishedAt ? new Date(t.finishedAt) : new Date(t.createdAt || '');
        return date <= end;
      });
    }
    result.sort((a, b) => {
      const dateA = a.finishedAt ? new Date(a.finishedAt) : new Date(a.createdAt || '');
      const dateB = b.finishedAt ? new Date(b.finishedAt) : new Date(b.createdAt || '');
      return dateB.getTime() - dateA.getTime();
    });
    this.filteredTasks = result;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}