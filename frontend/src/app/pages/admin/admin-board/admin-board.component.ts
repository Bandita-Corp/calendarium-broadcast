import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { PeriodsService } from '@/services/periods.service';
import { PresetsService } from '@/services/presets.service';
import { Period, Preset, User } from '@/models';
import { TimelineBarComponent } from '@/components/timeline-bar/timeline-bar.component';
import { PeriodCardComponent } from '@/components/period-card/period-card.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-board',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TimelineBarComponent, PeriodCardComponent, TranslateModule],
  templateUrl: './admin-board.component.html',
  styleUrl: './admin-board.component.css',
})
export class AdminBoardComponent implements OnInit {
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
