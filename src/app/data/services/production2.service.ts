import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductionTask {
  id: number;
  productName: string;
  productId: number;
  orderCode: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'preparing' | 'baking' | 'cooling' | 'packing' | 'completed';
  ovenId?: number;
  startTime?: string;
  endTime?: string;
  assignedTo?: string;
  remainingSeconds?: number;
  coolingRemainingSeconds?: number;
  finishedAt?: string;
  createdAt?: string;          
  bakingTemperature?: number; 
  bakingTimeMinutes?: number;  
}

export interface Oven {
  id: number;
  name: string;
  temperature: number;
  currentTask?: { productName: string; id: number } | null;
  remainingSeconds?: number | null;
  totalSeconds?: number | null;
}

export interface IngredientRequirement {
  ingredientId: number;
  name: string;
  needed: number;
  available: number;
  unit: string;
}

export interface Notification {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class Production2Service {
  private apiUrl = 'http://localhost:8000/api/production';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<ProductionTask[]> {
    return this.http.get<ProductionTask[]>(`${this.apiUrl}/tasks`);
  }

  getOvens(): Observable<Oven[]> {
    return this.http.get<Oven[]>(`${this.apiUrl}/ovens`);
  }

  getIngredientRequirements(): Observable<IngredientRequirement[]> {
    return this.http.get<IngredientRequirement[]>(`${this.apiUrl}/ingredients-requirements`);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`);
  }

  updateTaskStatus(taskId: number, newStatus: string, bakingParams?: { temperature: number; timeMinutes: number }): Observable<any> {
    const payload: any = { status: newStatus };
    if (bakingParams) {
      payload.temperature = bakingParams.temperature;
      payload.timeMinutes = bakingParams.timeMinutes;
    }
    return this.http.put(`${this.apiUrl}/tasks/${taskId}`, payload);
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {});
  }
}