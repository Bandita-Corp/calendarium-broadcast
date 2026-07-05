import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <nav class="navbar">
        <div class="nav-brand">
          <a routerLink="/" class="brand-link">
            <span class="brand-icon">🍋</span>
            <span class="brand-name">Lemon Seasons</span>
          </a>
        </div>

        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
            Board
          </a>

          @if (currentUser) {
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
              Dashboard
            </a>
            @if (isAdmin) {
              <a routerLink="/admin" routerLinkActive="active" class="nav-link admin-link">
                ⚡ Admin
              </a>
            }
          }
        </div>

        <div class="nav-user">
          @if (currentUser) {
            <div class="user-menu">
              <div class="user-avatar" [title]="currentUser.email">
                {{ getInitial(currentUser) }}
              </div>
              <div class="user-dropdown">
                <div class="user-info">
                  <span class="user-name">{{ currentUser.name || currentUser.email }}</span>
                  <span class="user-role" [class.admin-badge]="isAdmin">{{ currentUser.role }}</span>
                </div>
                <button class="logout-btn" (click)="logout()">Sign out</button>
              </div>
            </div>
          } @else {
            <a routerLink="/login" class="btn-outline">Login</a>
            <a routerLink="/register" class="btn-primary">Get Started</a>
          }
        </div>
      </nav>

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser: User | null = null;
  isAdmin = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'ADMIN';
    });
  }

  getInitial(user: User): string {
    if (user.name) return user.name[0].toUpperCase();
    return user.email[0].toUpperCase();
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
