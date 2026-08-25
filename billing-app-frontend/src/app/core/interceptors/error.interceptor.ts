import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (req.url.includes('/auth/login')) {
          const msg = err.error?.message || 'Invalid email or password.';
          toast.error(msg);
        } else {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('current_user');
          router.navigate(['/login']);
          toast.error('Session expired. Please log in again.');
        }
      } else if (err.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (err.status === 0) {
        toast.error('Cannot connect to server. Please check if the API is running.');
      } else {
        const msg = err.error?.message || err.message || 'An unexpected error occurred.';
        toast.error(msg);
      }
      return throwError(() => err);
    })
  );
};
