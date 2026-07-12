import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id: number;
  name: string;
  email?: string;
  city?: string;
  rating: number;
  text: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface CreateReviewData {
  name: string;
  email?: string;
  city?: string;
  rating: number;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/reviews';
  
  getAll(): Observable<Review[]> {
    return this.http.get<Review[]>(this.apiUrl);
  }
  
  getStats(): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.apiUrl}/stats`);
  }
  
  create(review: CreateReviewData): Observable<any> {
    return this.http.post(this.apiUrl, review);
  }
}