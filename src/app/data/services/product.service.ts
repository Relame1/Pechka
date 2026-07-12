import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductWithIngredients } from '../../data/interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8000/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getById(id: number): Observable<{ success: boolean; data: ProductWithIngredients }> {
    return this.http.get<{ success: boolean; data: ProductWithIngredients }>(`${this.apiUrl}/${id}`);
  }

  create(product: any): Observable<any> {
    return this.http.post(this.apiUrl, product);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateStock(id: number, stock: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/update-stock`, { stock });
  }

  update(id: number, product: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, product);
  }
}