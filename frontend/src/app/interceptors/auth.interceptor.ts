import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '@/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const authService = inject(AuthService);

  // Simple interceptor, assumes credentials (cookies) are sent automatically
  // For dealing with 401s, we might need to refresh token or redirect
  const cloned = req.clone({
    withCredentials: true
  });

  return next(cloned).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        // Handle 401 Unauthorized here by redirecting or attempting refresh
        // For simplicity, we just trigger logout
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
