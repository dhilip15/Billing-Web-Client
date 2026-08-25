import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreatePurchaseRequest, PurchaseDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly baseUrl = `${environment.apiUrl}/purchases`;
  constructor(private http: HttpClient) {}

  getAll(supplierId?: number): Observable<ApiResponse<PurchaseDto[]>> {
    const url = supplierId ? `${this.baseUrl}?supplierId=${supplierId}` : this.baseUrl;
    return this.http.get<ApiResponse<PurchaseDto[]>>(url);
  }

  getById(id: number): Observable<ApiResponse<PurchaseDto>> {
    return this.http.get<ApiResponse<PurchaseDto>>(`${this.baseUrl}/${id}`);
  }

  create(req: CreatePurchaseRequest): Observable<ApiResponse<PurchaseDto>> {
    return this.http.post<ApiResponse<PurchaseDto>>(this.baseUrl, req);
  }
}
