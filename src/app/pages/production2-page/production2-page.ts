import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, takeUntil } from 'rxjs';
import {
  Production2Service,
  ProductionTask,
  Oven,
  IngredientRequirement,
  Notification
} from '../../data/services/production2.service';
import { BakingSettingsModalComponent } from '../../common-ui/baking-settings-modal/baking-settings-modal';

@Component({
  selector: 'app-production2-page',
  standalone: true,
  imports: [CommonModule, BakingSettingsModalComponent],
  templateUrl: './production2-page.html',
  styleUrls: ['./production2-page.scss']
})
export class Production2Page implements OnInit, OnDestroy {
  tasks: ProductionTask[] = [];
  ovens: Oven[] = [];
  ingredients: IngredientRequirement[] = [];
  notifications: Notification[] = [];
  loading = true;

  kanbanColumns = ['pending', 'preparing', 'baking', 'cooling', 'packing', 'completed'];
  columnLabels: { [key: string]: string } = {
    pending: 'Ожидает',
    preparing: 'Подготовка',
    baking: 'Выпечка',
    cooling: 'Остывание',
    packing: 'Упаковка',
    completed: 'Завершено'
  };

  private destroy$ = new Subject<void>();
  private timerSubscription: any;

  showBakingModal = false;
  selectedTaskForBaking: ProductionTask | null = null;
  defaultBakingTemp = 200;
  defaultBakingTime = 30;

  private readonly COOLING_DURATION_SEC = 600;

  constructor(
    private productionService: Production2Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.timerSubscription = interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateOvenTimers();
      this.updateCoolingTimers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
  }

  private saveCoolingStartTime(taskId: number): void {
    localStorage.setItem(`cooling_start_${taskId}`, Date.now().toString());
  }

  private getCoolingRemaining(taskId: number): number | null {
    const start = localStorage.getItem(`cooling_start_${taskId}`);
    if (!start) return null;
    const elapsed = (Date.now() - parseInt(start, 10)) / 1000;
    const remaining = this.COOLING_DURATION_SEC - elapsed;
    if (remaining <= 0) {
      this.removeCoolingStartTime(taskId);
      return null;
    }
    return Math.floor(remaining);
  }

  private removeCoolingStartTime(taskId: number): void {
    localStorage.removeItem(`cooling_start_${taskId}`);
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.productionService.getTasks().toPromise(),
      this.productionService.getOvens().toPromise(),
      this.productionService.getIngredientRequirements().toPromise(),
      this.productionService.getNotifications().toPromise()
    ]).then(([tasks, ovens, ingredients, notifications]) => {
      this.tasks = tasks || [];
      this.ovens = ovens || [];
      this.ingredients = ingredients || [];
      this.notifications = notifications || [];
      this.tasks.forEach(task => {
        if (task.status === 'cooling') {
          const remaining = this.getCoolingRemaining(task.id);
          if (remaining !== null && remaining > 0) {
            task.coolingRemainingSeconds = remaining;
          } else {
            task.coolingRemainingSeconds = this.COOLING_DURATION_SEC;
            this.saveCoolingStartTime(task.id);
          }
        }
      });

      this.loading = false;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error(err);
      this.loading = false;
    });
  }

  getTasksByStatus(status: string): ProductionTask[] {
    return this.tasks.filter(t => t.status === status);
  }

  getNextStatus(current: string): string | null {
    const index = this.kanbanColumns.indexOf(current);
    return index < this.kanbanColumns.length - 1 ? this.kanbanColumns[index + 1] : null;
  }

  getPrevStatus(current: string): string | null {
    const index = this.kanbanColumns.indexOf(current);
    return index > 0 ? this.kanbanColumns[index - 1] : null;
  }

  canMoveNext(status: string): boolean {
    const next = this.getNextStatus(status);
    if (!next) return false;
    if (next === 'baking') {
      const freeOvens = this.ovens.filter(o => !o.currentTask).length;
      if (freeOvens === 0) return false;
    }
    return status !== 'completed';
  }

  canMovePrev(status: string): boolean {
    return this.getPrevStatus(status) !== null && status !== 'pending';
  }

  moveTask(task: ProductionTask, newStatus: string): void {
    if (!newStatus) return;
    if (task.status === 'preparing' && newStatus === 'baking') {
      this.selectedTaskForBaking = task;
      this.defaultBakingTemp = 200;
      this.defaultBakingTime = 30;
      this.showBakingModal = true;
      return;
    }
    this.performMoveTask(task, newStatus);
  }

  performMoveTask(task: ProductionTask, newStatus: string, bakingParams?: { temperature: number; timeMinutes: number }): void {
    if (newStatus === 'baking') {
      const freeOvens = this.ovens.filter(o => !o.currentTask).length;
      if (freeOvens === 0) {
        alert('Нет свободных печей!');
        return;
      }
    }
    this.productionService.updateTaskStatus(task.id, newStatus, bakingParams).subscribe({
      next: () => {
        task.status = newStatus as ProductionTask['status'];
        if (newStatus === 'cooling') {
          task.coolingRemainingSeconds = this.COOLING_DURATION_SEC;
          this.saveCoolingStartTime(task.id);
          this.loadData();
        }
        if (newStatus === 'completed') {
          this.removeCoolingStartTime(task.id);
          this.loadData();
        }
        if (newStatus === 'baking') {
          this.loadData(); // обновляем печи, чтобы отобразить занятость
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  onBakingConfirm(params: { temperature: number; timeMinutes: number }): void {
    if (this.selectedTaskForBaking) {
      this.performMoveTask(this.selectedTaskForBaking, 'baking', params);
      this.selectedTaskForBaking = null;
    }
    this.showBakingModal = false;
  }

  closeBakingModal(): void {
    this.showBakingModal = false;
    this.selectedTaskForBaking = null;
  }

  updateOvenTimers(): void {
    let needReload = false;
    this.ovens.forEach(oven => {
      if (oven.remainingSeconds !== undefined && oven.remainingSeconds !== null && oven.remainingSeconds > 0) {
        oven.remainingSeconds--;
        if (oven.remainingSeconds === 0 && oven.currentTask) {
          needReload = true;
        }
      }
    });
    if (needReload) {
      this.loadData();
    } else {
      this.cdr.detectChanges();
    }
  }

  updateCoolingTimers(): void {
    let changed = false;
    this.tasks.forEach(task => {
      if (task.status === 'cooling' && task.coolingRemainingSeconds !== undefined && task.coolingRemainingSeconds > 0) {
        task.coolingRemainingSeconds--;
        changed = true;
        if (task.coolingRemainingSeconds === 0) {
          this.productionService.updateTaskStatus(task.id, 'packing').subscribe({
            next: () => {
              task.status = 'packing';
              task.coolingRemainingSeconds = undefined;
              this.removeCoolingStartTime(task.id);
              this.loadData(); // обновляем данные после перехода
              this.cdr.detectChanges();
            },
            error: (err) => console.error(err)
          });
        }
      }
    });
    if (changed) {
      this.cdr.detectChanges();
    }
  }

  formatRemaining(seconds?: number): string {
    if (!seconds || seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'baking': return 'status-baking';
      case 'cooling': return 'status-cooling';
      case 'packing': return 'status-packing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  getStockClass(needed: number, available: number): string {
    if (available <= 0) return 'stock-empty';
    if (available < needed) return 'stock-low';
    return 'stock-ok';
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'warning': return 'notif-warning';
      case 'error': return 'notif-error';
      case 'success': return 'notif-success';
      default: return 'notif-info';
    }
  }

  markAsRead(notif: Notification): void {
    if (!notif.read) {
      this.productionService.markNotificationAsRead(notif.id).subscribe(() => {
        notif.read = true;
        this.cdr.detectChanges();
      });
    }
  }
}