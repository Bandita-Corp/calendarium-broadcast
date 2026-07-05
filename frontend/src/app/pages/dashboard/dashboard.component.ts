import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PeriodsService } from '../../services/periods.service';
import { Period, User } from '../../models';
import { TimelineBarComponent } from '../../components/timeline-bar/timeline-bar.component';
import { PeriodCardComponent } from '../../components/period-card/period-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TimelineBarComponent, PeriodCardComponent],
  template: `
    <div class="page dashboard-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            Welcome back{{ user?.name ? ', ' + user?.name : '' }}!
          </h1>
          <p class="page-subtitle">Here's an overview of this year's seasons</p>
        </div>
        @if (isAdmin) {
          <a routerLink="/admin/periods" class="btn-primary">
            + Manage Periods
          </a>
        }
      </div>

      @if (loading) {
        <div class="loading-state"><div class="spinner"></div></div>
      } @else {
        <section class="section">
          <h2 class="section-title">Annual Timeline</h2>
          <app-timeline-bar [periods]="periods" [year]="currentYear" />
        </section>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">All Periods</h2>
            <span class="badge">{{ periods.length }}</span>
          </div>
          <div class="period-cards-grid">
            @for (period of periods; track period.id) {
              <app-period-card [period]="period" [isActive]="isPeriodActive(period)" />
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">🍋</span>
                <p>No periods yet.</p>
                @if (isAdmin) {
                  <a routerLink="/admin/periods" class="btn-outline">Create first period</a>
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private periodsService = inject(PeriodsService);

  user: User | null = null;
  periods: Period[] = [];
  loading = true;
  currentYear = new Date().getFullYear();

  get isAdmin() {
    return this.user?.role === 'ADMIN';
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    this.periodsService.getPeriods().subscribe({
      next: (periods) => {
        this.periods = periods;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  isPeriodActive(period: Period): boolean {
    const now = new Date();
    return new Date(period.startDate) <= now && new Date(period.endDate) >= now;
  }
}
