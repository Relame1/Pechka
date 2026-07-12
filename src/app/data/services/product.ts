import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  http = inject(HttpClient);

  baseApiUrl = 'http://localhost:3000';

  getProducts() {
    return this.http.get<Product[]>(`${this.baseApiUrl}/products`);
  }
}