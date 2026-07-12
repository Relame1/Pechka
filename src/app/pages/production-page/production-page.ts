import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, interval, takeUntil } from 'rxjs';
import { Production2Service, ProductionTask, Oven, IngredientRequirement } from '../../data/services/production2.service';

@Component({
  selector: 'app-production-page',
  templateUrl: './production-page.html',
  styleUrls: ['./production-page.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class ProductionPage implements OnInit, OnDestroy {
  loading = true;

  tasks: any[] = [];
  ovens: any[] = [];
  ingredients: any[] = [];
  lastCompleted: any[] = [];

  stats = {
    active: 0,
    inProgress: 0,
    completedToday: 0,
    delayed: 0
  };

  skeletonCards = Array(4).fill(0);
  skeletonKanbanCols = ['pending', 'preparing', 'baking', 'cooling', 'packing', 'completed'];

  private destroy$ = new Subject<void>();
  private timerSubscription: any;
  private ovenRefreshInterval: any;

  constructor(
    private productionService: Production2Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.timerSubscription = interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.tickOvenTimers();
    });
    this.ovenRefreshInterval = interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshOvensOnly();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    if (this.ovenRefreshInterval) this.ovenRefreshInterval.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.productionService.getTasks().toPromise(),
      this.productionService.getOvens().toPromise(),
      this.productionService.getIngredientRequirements().toPromise()
    ]).then(([tasks, ovens, ingredients]) => {
      this.processTasks(tasks || []);
      this.processOvens(ovens || []);
      this.processIngredients(ingredients || []);
      this.calculateStats(tasks || []);
      this.updateLastCompleted(tasks || []);
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error(err);
      this.loading = false;
    });
  }

  private refreshOvensOnly(): void {
    this.productionService.getOvens().toPromise().then(ovens => {
      if (ovens) this.processOvens(ovens);
      this.cdr.detectChanges();
    }).catch(err => console.error(err));
  }

  private processTasks(tasks: ProductionTask[]): void {
    this.tasks = tasks.map(task => ({
      id: task.id,
      productName: task.productName,
      orderCode: task.orderCode,
      quantity: task.quantity,
      unit: task.unit,
      status: task.status,
      assignedTo: task.assignedTo,
      startTime: task.startTime,
      endTime: task.endTime
    }));
  }

  private processOvens(ovens: Oven[]): void {
    this.ovens = ovens.map(oven => {
      const currentTask = oven.currentTask?.productName || null;
      const remainingSeconds = oven.remainingSeconds ?? 0;
      const totalSeconds = oven.totalSeconds ?? 600; // запасное значение
      return {
        ovenId: oven.id,
        ovenName: oven.name,
        temp: oven.temperature,
        currentTask: currentTask || '—',
        remaining: this.formatRemainingTime(remainingSeconds),
        nextTask: (oven as any).nextTask || null, // если бэкенд когда-нибудь вернёт
        _remainingSeconds: remainingSeconds,
        _totalSeconds: totalSeconds
      };
    });
  }

  private processIngredients(ingredients: IngredientRequirement[]): void {
    this.ingredients = ingredients.map(ing => ({
      ingredient: ing.name,
      needed: ing.needed,
      unit: ing.unit,
      available: ing.available
    }));
  }

  private calculateStats(tasks: ProductionTask[]): void {
    const today = new Date().toISOString().slice(0, 10);
    this.stats.active = tasks.filter(t => t.status !== 'completed').length;
    this.stats.inProgress = tasks.filter(t => t.status === 'preparing' || t.status === 'baking').length;
    this.stats.completedToday = tasks.filter(t =>
      t.status === 'completed' && (t.finishedAt?.startsWith(today) || false)
    ).length;
    this.stats.delayed = 0;
  }

  private updateLastCompleted(tasks: ProductionTask[]): void {
    const completed = tasks.filter(t => t.status === 'completed')
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 5);
    this.lastCompleted = completed.map(task => ({
      productName: task.productName,
      quantity: task.quantity,
      unit: task.unit,
      orderCode: task.orderCode
    }));
  }

  private formatRemainingTime(seconds: number): string {
    if (seconds <= 0) return 'свободна';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  private tickOvenTimers(): void {
    let needReload = false;
    for (let oven of this.ovens) {
      if (oven._remainingSeconds && oven._remainingSeconds > 0) {
        oven._remainingSeconds--;
        oven.remaining = this.formatRemainingTime(oven._remainingSeconds);
        if (oven._remainingSeconds === 0) {
          needReload = true;
        }
      }
    }
    if (needReload) {
      this.refreshOvensOnly();
      this.productionService.getTasks().toPromise().then(tasks => {
        if (tasks) this.processTasks(tasks);
        this.cdr.detectChanges();
      }).catch(err => console.error(err));
    } else {
      this.cdr.detectChanges();
    }
  }

  getTasksByStatus(status: string): any[] {
    return this.tasks.filter(t => t.status === status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'preparing': return 'Подготовка';
      case 'baking': return 'Выпечка';
      case 'cooling': return 'Остывание';
      case 'packing': return 'Упаковка';
      case 'completed': return 'Завершено';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStockLevelClass(needed: number, available: number): string {
    if (available <= 0) return 'stock-empty';
    if (available < needed) return 'stock-low';
    return 'stock-ok';
  }
}