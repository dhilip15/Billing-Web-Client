import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateProductRequest, ProductDto, UpdateProductRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  getAll(page: number = 1, pageSize: number = 20, search?: string, categoryId?: number): Observable<any> {
    let url = `${this.baseUrl}?page=${page}&pageSize=${pageSize}`;
    if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return this.http.get<any>(url);
  }

  getById(id: number): Observable<ApiResponse<ProductDto>> {
    return this.http.get<ApiResponse<ProductDto>>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateProductRequest): Observable<ApiResponse<ProductDto>> {
    return this.http.post<ApiResponse<ProductDto>>(this.baseUrl, req);
  }

  update(id: number, req: UpdateProductRequest): Observable<ApiResponse<ProductDto>> {
    return this.http.put<ApiResponse<ProductDto>>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
