import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@/services/auth.service';
import { User } from '@/models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LangSwitcherComponent } from '@/components/lang-switcher/lang-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, LangSwitcherComponent],
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
          <app-lang-switcher></app-lang-switcher>

          @if (currentUser) {
            <a routerLink="/dashboard/work" routerLinkActive="active" class="nav-link">
              {{ 'NAV.DASHBOARD' | translate }}
            </a>
            <a routerLink="/dashboard/live/calendar" routerLinkActive="active" class="nav-link">
              {{ 'NAV.CALENDAR' | translate }}
            </a>
            <a routerLink="/dashboard/live/timeline" routerLinkActive="active" class="nav-link">
              {{ 'NAV.TIMELINE' | translate }}
            </a>
          }
        </div>

        <div class="nav-user">
          @if (currentUser) {
            @if (isAdmin) {
              <a routerLink="/admin" routerLinkActive="active" class="nav-link admin-link">
                ⚡ {{ 'NAV.ADMIN' | translate }}
              </a>
            }
            <div class="user-menu">
              <div class="user-avatar" [title]="currentUser.email">
                {{ getInitial(currentUser) }}
              </div>
              <div class="user-dropdown">
                <div class="user-info">
                  <span class="user-name">{{ currentUser.name || currentUser.email }}</span>
                  <span class="user-role" [class.admin-badge]="isAdmin">{{ currentUser.role }}</span>
                </div>
                <button class="logout-btn" (click)="logout()">{{ 'AUTH.SIGN_OUT' | translate }}</button>
              </div>
            </div>
          } @else {
            <a routerLink="/login" class="btn-outline">{{ 'AUTH.LOGIN' | translate }}</a>
            <a routerLink="/register" class="btn-primary">{{ 'AUTH.GET_STARTED' | translate }}</a>
          }
        </div>
      </nav>

      <main class="main-content">
        <router-outlet />
      </main>

      <footer class="app-footer">
        <div class="footer-content">
          <div class="footer-logo">
            <span class="brand-icon grayscale">🍋</span>
            <span class="brand-name">Lemon Seasons</span>
          </div>
          <div class="footer-copyright">
            &copy; {{ currentYear }} Lemon Seasons. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  currentUser: User | null = null;
  isAdmin = false;
  currentYear = new Date().getFullYear();

  constructor() {
    this.translate.setDefaultLang('en');
    this.translate.use('ru'); // Russian variant
  }

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
