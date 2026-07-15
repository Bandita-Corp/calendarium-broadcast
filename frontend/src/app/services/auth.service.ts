import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, catchError, of, throwError } from 'rxjs';
import { User } from '@/models';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(data: any) {
    return this.http.post<User>('/api/auth/register', data);
  }

  login(data: any) {
    return this.http.post<{user: User, accessToken: string, refreshToken: string}>('/api/auth/login', data).pipe(
      tap(res => this.currentUserSubject.next(res.user))
    );
  }

  logout() {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      })
    );
  }

  fetchMe() {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError((err) => {
        this.currentUserSubject.next(null);
        return throwError(() => err);
      })
    );
  }

  refreshTokens() {
    return this.http.post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {}).pipe(
      // Keep credentials automatically sent via HttpOnly cookie
    );
  }

  clearSession() {
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
