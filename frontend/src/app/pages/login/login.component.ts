import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-logo">🍋</span>
          <h1 class="auth-title">Welcome back</h1>
          <p class="auth-subtitle">Sign in to Lemon Seasons</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (errorMsg) {
            <div class="alert alert-error">{{ errorMsg }}</div>
          }

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              type="email"
              class="form-input"
              formControlName="email"
              placeholder="you@example.com"
              [class.invalid]="form.get('email')?.invalid && form.get('email')?.touched"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-input"
              formControlName="password"
              placeholder="••••••••"
              [class.invalid]="form.get('password')?.invalid && form.get('password')?.touched"
            />
          </div>

          <button
            type="submit"
            class="btn-primary btn-full"
            [disabled]="loading || form.invalid"
          >
            @if (loading) {
              <span class="btn-spinner"></span>
              Signing in...
            } @else {
              Sign in
            }
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account?
          <a routerLink="/register" class="auth-link">Create one</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  errorMsg = '';

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.authService
      .login({
        email: this.form.value.email!,
        password: this.form.value.password!,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.router.navigate(
            res.user.role === 'ADMIN' ? ['/admin'] : ['/dashboard'],
          );
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg =
            err.error?.message || 'Invalid credentials. Please try again.';
        },
      });
  }
}
