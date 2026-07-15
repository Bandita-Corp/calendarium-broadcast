import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '@/services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const cloned = req.clone({
    withCredentials: true
  });

  return next(cloned).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // If the error occurred on login or refresh, do not try to refresh
        if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
          if (req.url.includes('/auth/refresh')) {
            authService.clearSession();
          }
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshSubject.next(null);

          return authService.refreshTokens().pipe(
            switchMap(() => {
              isRefreshing = false;
              refreshSubject.next(true);
              return next(cloned);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshSubject.next(false);
              authService.clearSession();
              return throwError(() => refreshError);
            })
          );
        } else {
          // If already refreshing, wait for the status to change
          return refreshSubject.pipe(
            filter((result) => result !== null),
            take(1),
            switchMap((success) => {
              if (success) {
                return next(cloned);
              } else {
                return throwError(() => error);
              }
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
