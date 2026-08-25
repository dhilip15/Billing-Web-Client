import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CreateUserRequest, LoginRequest, LoginResponse, UserDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<UserDto | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): UserDto | null { return this.currentUserSubject.value; }
  get token(): string | null { return localStorage.getItem('jwt_token'); }
  get isLoggedIn(): boolean { return !!this.token; }
  get role(): string { return this.getRoleName(); }

  getRoleName(role?: any): string {
    let r = role !== undefined ? role : ((this.currentUser as any)?.role ?? (this.currentUser as any)?.Role);
    if (r === undefined || r === null || r === '') {
      const tokenRole = this.getRoleFromToken();
      if (tokenRole) r = tokenRole;
    }
    if (r === undefined || r === null || r === '') return '';

    const num = Number(r);
    if (!isNaN(num)) {
      if (num === 1) return 'Admin';
      if (num === 2) return 'Manager';
      if (num === 3) return 'Cashier';
      if (num === 0) return 'Admin';
    }

    const str = String(r).toLowerCase().trim();
    if (str.includes('admin') || str === '1') return 'Admin';
    if (str.includes('manager') || str === '2') return 'Manager';
    if (str.includes('cashier') || str === '3') return 'Cashier';

    return String(r);
  }

  private getRoleFromToken(): string | null {
    const token = this.token;
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
      return payload['role']
        || payload['Role']
        || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        || payload['UserRole']
        || null;
    } catch {
      return null;
    }
  }

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, request).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('jwt_token', res.data.token);
          localStorage.setItem('current_user', JSON.stringify(res.data.user));
          this.currentUserSubject.next(res.data.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/me`);
  }

  getUsers(): Observable<ApiResponse<UserDto[]>> {
    return this.http.get<ApiResponse<UserDto[]>>(`${this.baseUrl}/users`);
  }

  createUser(req: CreateUserRequest): Observable<ApiResponse<UserDto>> {
    return this.http.post<ApiResponse<UserDto>>(`${this.baseUrl}/users`, req);
  }

  private loadUser(): UserDto | null {
    try {
      const u = localStorage.getItem('current_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }
}
