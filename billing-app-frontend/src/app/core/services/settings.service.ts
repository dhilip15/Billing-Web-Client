import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StoreSettings {
  id: number;
  storeName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly base = `${environment.apiUrl}/settings`;

  private _settings$ = new BehaviorSubject<StoreSettings | null>(null);
  readonly settings$ = this._settings$.asObservable();

  constructor(private http: HttpClient) {}

  get settings(): StoreSettings | null {
    return this._settings$.value;
  }

  get storeName(): string {
    return this._settings$.value?.storeName ?? 'My Store';
  }

  load(): Observable<ApiResponse<StoreSettings>> {
    return this.http.get<ApiResponse<StoreSettings>>(this.base).pipe(
      tap(res => this._settings$.next(res.data))
    );
  }

  update(payload: Partial<StoreSettings>): Observable<ApiResponse<StoreSettings>> {
    return this.http.put<ApiResponse<StoreSettings>>(this.base, payload).pipe(
      tap(res => this._settings$.next(res.data))
    );
  }
}
