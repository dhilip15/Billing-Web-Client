import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, BillDto, BillListDto, CreateBillRequest, PagedResult
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly baseUrl = `${environment.apiUrl}/bills`;
  constructor(private http: HttpClient) {}

  getAll(page = 1, pageSize = 20, status?: string, from?: string, to?: string): Observable<ApiResponse<PagedResult<BillListDto>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ApiResponse<PagedResult<BillListDto>>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<BillDto>> {
    return this.http.get<ApiResponse<BillDto>>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateBillRequest): Observable<ApiResponse<BillDto>> {
    return this.http.post<ApiResponse<BillDto>>(this.baseUrl, req);
  }

  finalize(id: number): Observable<ApiResponse<BillDto>> {
    return this.http.post<ApiResponse<BillDto>>(`${this.baseUrl}/${id}/finalize`, {});
  }

  hold(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${id}/hold`, {});
  }

  cancel(id: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  processReturn(id: number): Observable<ApiResponse<BillDto>> {
    return this.http.post<ApiResponse<BillDto>>(`${this.baseUrl}/${id}/return`, {});
  }
}
