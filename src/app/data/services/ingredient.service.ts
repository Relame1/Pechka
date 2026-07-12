import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ingredient {
  id?: number;
  name: string;
  category: string;
  unit: string;
  stock: number;
  min_stock: number;        // snake_case из Laravel
  price_per_unit: number;
  last_delivery?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  private apiUrl = 'http://localhost:8000/api/ingredients';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.apiUrl);
  }

  create(ingredient: Omit<Ingredient, 'id'>): Observable<any> {
    return this.http.post(this.apiUrl, ingredient);
  }

  update(id: number, ingredient: Partial<Ingredient>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, ingredient);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}