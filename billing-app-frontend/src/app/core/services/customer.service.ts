import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateCustomerRequest, CustomerDto, PagedResult, UpdateCustomerRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;
  constructor(private http: HttpClient) {}

  getAll(page = 1, pageSize = 20, search?: string): Observable<ApiResponse<PagedResult<CustomerDto>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PagedResult<CustomerDto>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<CustomerDto>> {
    return this.http.get<ApiResponse<CustomerDto>>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateCustomerRequest): Observable<ApiResponse<CustomerDto>> {
    return this.http.post<ApiResponse<CustomerDto>>(this.baseUrl, req);
  }

  update(id: number, req: UpdateCustomerRequest): Observable<ApiResponse<CustomerDto>> {
    return this.http.put<ApiResponse<CustomerDto>>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
