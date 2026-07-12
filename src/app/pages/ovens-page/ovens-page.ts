import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, takeUntil } from 'rxjs';
import { Production2Service, Oven, ProductionTask } from '../../data/services/production2.service';

@Component({
  selector: 'app-ovens-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ovens-page.html',
  styleUrls: ['./ovens-page.scss']
})
export class OvensPage implements OnInit, OnDestroy {
  ovens: Oven[] = [];
  pendingTasks: ProductionTask[] = [];
  recentCompleted: ProductionTask[] = [];
  loading = true;
  private destroy$ = new Subject<void>();
  private timerSubscription: any;

  constructor(
    private productionService: Production2Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.timerSubscription = interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateOvenTimers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
  }

  loadAllData(): void {
    this.loading = true;
    Promise.all([
      this.productionService.getOvens().toPromise(),
      this.productionService.getTasks().toPromise()
    ]).then(([ovens, tasks]) => {
      this.ovens = ovens || [];
      if (tasks) {
        this.pendingTasks = tasks.filter(t =>
          t.status === 'pending' || t.status === 'preparing'
        ).sort((a, b) => (a.id || 0) - (b.id || 0));
        this.recentCompleted = tasks.filter(t => t.status === 'completed')
          .sort((a, b) => (b.id || 0) - (a.id || 0))
          .slice(0, 5);
      }
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Ошибка загрузки данных', err);
      this.loading = false;
    });
  }

  get totalOvens(): number { return this.ovens.length; }
  get busyOvens(): number { return this.ovens.filter(o => o.currentTask).length; }
  get freeOvens(): number { return this.ovens.filter(o => !o.currentTask).length; }
  get averageLoad(): number {
    return this.totalOvens ? Math.round((this.busyOvens / this.totalOvens) * 100) : 0;
  }

  get planSummary(): { name: string; quantity: number; unit: string }[] {
    const map = new Map<string, { name: string; quantity: number; unit: string }>();
    this.pendingTasks.forEach(task => {
      const key = task.productName;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantity += task.quantity;
      } else {
        map.set(key, {
          name: task.productName,
          quantity: task.quantity,
          unit: task.unit
        });
      }
    });
    return Array.from(map.values());
  }

  updateOvenTimers(): void {
    let changed = false;
    this.ovens.forEach(oven => {
      if (oven.remainingSeconds !== undefined && oven.remainingSeconds !== null && oven.remainingSeconds > 0) {
        oven.remainingSeconds--;
        changed = true;
        if (oven.remainingSeconds === 0 && oven.currentTask) {
          const taskId = oven.currentTask.id;
          this.productionService.updateTaskStatus(taskId, 'cooling').subscribe({
            next: () => this.loadAllData(),
            error: (err) => console.error('Ошибка перевода в остывание', err)
          });
        }
      }
    });
    if (changed) this.cdr.detectChanges();
  }

  formatRemaining(seconds?: number): string {
    if (!seconds || seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  releaseOven(oven: Oven): void {
    if (!oven.currentTask) return;
    const taskId = oven.currentTask.id;
    if (confirm(`Освободить печь "${oven.name}"? Текущая задача "${oven.currentTask.productName}" будет переведена в остывание.`)) {
      this.productionService.updateTaskStatus(taskId, 'cooling').subscribe({
        next: () => this.loadAllData(),
        error: (err) => console.error('Ошибка освобождения печи', err)
      });
    }
  }

  refresh(): void {
    this.loadAllData();
  }
}