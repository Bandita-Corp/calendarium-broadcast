import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PeriodsService } from '../../services/periods.service';
import { PresetsService } from '../../services/presets.service';
import { Period, Preset, User } from '../../models';
import { TimelineBarComponent } from '../../components/timeline-bar/timeline-bar.component';
import { PeriodCardComponent } from '../../components/period-card/period-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TimelineBarComponent, PeriodCardComponent],
  template: `
    <div class="page dashboard-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            Welcome back{{ user?.name ? ', ' + user?.name : '' }}!
          </h1>
          <p class="page-subtitle">Here's an overview of your selected periods</p>
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
          <div class="section-header">
            <h2 class="section-title">Calendar View</h2>
            <div class="controls" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <label>Preset:</label>
                <select [(ngModel)]="selectedPresetId" (change)="onPresetChange()" class="form-input" style="width: auto;">
                  <option [ngValue]="null">All Periods</option>
                  @for (preset of presets; track preset.id) {
                    <option [ngValue]="preset.id">{{ preset.name }}</option>
                  }
                </select>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center; margin-left: auto;">
                <input type="text" [(ngModel)]="newPresetName" placeholder="New Preset Name" class="form-input" style="width: 150px;">
                <button class="btn-outline" (click)="createPreset()" [disabled]="!newPresetName">Add</button>
              </div>
            </div>
          </div>
          <app-timeline-bar [periods]="visiblePeriods" [year]="currentYear" />
        </section>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Periods ({{ periods.length }})</h2>
            <span class="badge">Select periods to view on calendar</span>
          </div>
          <div class="period-cards-grid">
            @for (period of periods; track period.id) {
              <div class="period-wrapper" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" 
                         [checked]="selectedPeriodIds.has(period.id)"
                         (change)="togglePeriod(period.id)" />
                  Show on calendar
                </label>
                <app-period-card [period]="period" [isActive]="isPeriodActive(period)" />
              </div>
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
  private presetsService = inject(PresetsService);

  user: User | null = null;
  periods: Period[] = [];
  presets: Preset[] = [];
  selectedPresetId: string | null = null;
  selectedPeriodIds = new Set<string>();
  newPresetName = '';
  
  loading = true;
  currentYear = new Date().getFullYear();

  get isAdmin() {
    return this.user?.role === 'ADMIN';
  }

  get visiblePeriods(): Period[] {
    return this.periods.filter(p => this.selectedPeriodIds.has(p.id));
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.presetsService.getPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        this.loadPeriods();
      },
      error: () => this.loadPeriods(),
    });
  }

  loadPeriods() {
    this.periodsService.getPeriods().subscribe({
      next: (periods) => {
        if (this.selectedPresetId) {
          this.periods = periods.filter(p => p.presetId === this.selectedPresetId);
        } else {
          this.periods = periods;
        }
        // By default select all for view
        this.selectedPeriodIds = new Set(this.periods.map(p => p.id));
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPresetChange() {
    this.loadPeriods();
  }

  togglePeriod(id: string) {
    if (this.selectedPeriodIds.has(id)) {
      this.selectedPeriodIds.delete(id);
    } else {
      this.selectedPeriodIds.add(id);
    }
  }

  createPreset() {
    if (!this.newPresetName) return;
    this.presetsService.createPreset({ name: this.newPresetName }).subscribe({
      next: (preset) => {
        this.presets.push(preset);
        this.selectedPresetId = preset.id;
        this.newPresetName = '';
        this.onPresetChange();
      }
    });
  }

  isPeriodActive(period: Period): boolean {
    const now = new Date();
    return new Date(period.startDate) <= now && new Date(period.endDate) >= now;
  }
}
