import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-logo">🍋</span>
          <h1 class="auth-title">Create account</h1>
          <p class="auth-subtitle">Join Lemon Seasons</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          @if (errorMsg) {
            <div class="alert alert-error">{{ errorMsg }}</div>
          }
          @if (successMsg) {
            <div class="alert alert-success">{{ successMsg }}</div>
          }

          <div class="form-group">
            <label class="form-label" for="name">Name <span class="optional">(optional)</span></label>
            <input id="name" type="text" class="form-input" formControlName="name" placeholder="Your name" />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              class="form-input"
              formControlName="email"
              placeholder="you@example.com"
              [class.invalid]="form.get('email')?.invalid && form.get('email')?.touched"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              class="form-input"
              formControlName="password"
              placeholder="At least 8 characters"
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
              Creating account...
            } @else {
              Create account
            }
          </button>
        </form>

        <p class="auth-footer">
          Already have an account?
          <a routerLink="/login" class="auth-link">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = false;
  errorMsg = '';
  successMsg = '';

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.authService
      .register({
        name: this.form.value.name || undefined,
        email: this.form.value.email!,
        password: this.form.value.password!,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMsg = 'Account created! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg =
            err.error?.message || 'Registration failed. Please try again.';
        },
      });
  }
}
