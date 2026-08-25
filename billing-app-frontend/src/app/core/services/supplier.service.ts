import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateSupplierRequest, SupplierDto, UpdateSupplierRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly baseUrl = `${environment.apiUrl}/suppliers`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<SupplierDto[]>> {
    return this.http.get<ApiResponse<SupplierDto[]>>(this.baseUrl);
  }

  getById(id: number): Observable<ApiResponse<SupplierDto>> {
    return this.http.get<ApiResponse<SupplierDto>>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateSupplierRequest): Observable<ApiResponse<SupplierDto>> {
    return this.http.post<ApiResponse<SupplierDto>>(this.baseUrl, req);
  }

  update(id: number, req: UpdateSupplierRequest): Observable<ApiResponse<SupplierDto>> {
    return this.http.put<ApiResponse<SupplierDto>>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
