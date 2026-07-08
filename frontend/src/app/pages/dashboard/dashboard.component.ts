import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { PresetsService } from '@/services/presets.service';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarViewComponent } from '@/components/calendar-view/calendar-view.component';
import { Preset, Period } from '@/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CalendarViewComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  presetsService = inject(PresetsService);

  presets: Preset[] = [];
  selectedPresetIds = new Set<string>();
  newPresetName = '';

  ngOnInit() {
    this.presetsService.getPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        // Select all by default
        presets.forEach(p => this.selectedPresetIds.add(p.id));
      },
      error: (err) => console.error('Error fetching presets:', err)
    });
  }

  isSelected(id: string): boolean {
    return this.selectedPresetIds.has(id);
  }

  togglePreset(id: string) {
    if (this.selectedPresetIds.has(id)) {
      this.selectedPresetIds.delete(id);
    } else {
      this.selectedPresetIds.add(id);
    }
  }

  createPreset() {
    if (!this.newPresetName) return;
    this.presetsService.createPreset({ name: this.newPresetName }).subscribe({
      next: (preset) => {
        this.presets.push(preset);
        this.selectedPresetIds.add(preset.id);
        this.newPresetName = '';
      }
    });
  }

  get displayedPeriods(): Period[] {
    return this.presets
      .filter(p => this.selectedPresetIds.has(p.id))
      .flatMap(p => p.periods || []);
  }

  get livePeriods(): Period[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.displayedPeriods.filter(p => {
      const start = new Date(p.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(p.endDate);
      end.setHours(23, 59, 59, 999);
      
      return today >= start && today <= end;
    });
  }
}
