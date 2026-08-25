import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SalesReportDto, SalesReportRequest, StockLedgerDto, StockReportItemDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StockLedgerService {
  private readonly baseUrl = `${environment.apiUrl}/stock-ledger`;
  constructor(private http: HttpClient) {}

  getByProduct(productId: number): Observable<ApiResponse<StockLedgerDto[]>> {
    return this.http.get<ApiResponse<StockLedgerDto[]>>(`${this.baseUrl}/${productId}`);
  }

  getRecent(count = 50): Observable<ApiResponse<StockLedgerDto[]>> {
    return this.http.get<ApiResponse<StockLedgerDto[]>>(`${this.baseUrl}/recent?count=${count}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly baseUrl = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  getSalesReport(req: SalesReportRequest): Observable<ApiResponse<SalesReportDto>> {
    return this.http.post<ApiResponse<SalesReportDto>>(`${this.baseUrl}/sales`, req);
  }

  getStockReport(): Observable<ApiResponse<StockReportItemDto[]>> {
    return this.http.get<ApiResponse<StockReportItemDto[]>>(`${this.baseUrl}/stock`);
  }
}
