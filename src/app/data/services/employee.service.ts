import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Employee, EmployeeStats, EmployeeFormData } from '../interfaces/employee.interface';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'http://localhost:8000/api/employees';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map((employees: any) => {
        const employeesData = employees.data || employees;
        return employeesData;
      })
    );
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map((employee: any) => {
        return employee.data || employee;
      })
    );
  }

  create(employee: EmployeeFormData): Observable<any> {
    return this.http.post(this.apiUrl, employee, { headers: this.getHeaders() });
  }

  update(id: number, employee: Partial<EmployeeFormData>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, employee, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getStats(): Observable<EmployeeStats> {
    return this.http.get<EmployeeStats>(`${this.apiUrl}/stats`, { headers: this.getHeaders() }).pipe(
      map((stats: any) => {
        return stats.data || stats;
      })
    );
  }

  resetPassword(id: number, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reset-password`, { password }, { headers: this.getHeaders() });
  }
}