import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaleItem {
  product_id: number;
  quantity: number;
  price: number;
  total?: number;
  product?: {
    id: number;
    name: string;
    unit: string;
    price?: number;
  };
}

export interface Sale {
  id?: number;
  customer_name?: string | null;
  total?: number;
  items?: SaleItem[];
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private apiUrl = 'http://localhost:8000/api/sales';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  getById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  create(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}