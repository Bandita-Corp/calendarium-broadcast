import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { PresetsService } from '@/services/presets.service';
import { PeriodsService } from '@/services/periods.service';
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
  periodsService = inject(PeriodsService);

  presets: Preset[] = [];
  selectedPresetIds = new Set<string>();
  expandedPresetIds = new Set<string>();
  newPresetName = '';
  currentMode: 'live' | 'edit' = 'live';

  // Period Form fields
  showPeriodForm = false;
  editingPeriodId: string | null = null;
  activePresetIdForPeriod = '';
  periodFormModel = {
    name: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6',
    noteType: '',
    noteContent: ''
  };

  ngOnInit() {
    this.loadPresetsAndSelectAll(true);
  }

  loadPresetsAndSelectAll(selectAll = false) {
    this.presetsService.getPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        if (selectAll) {
          presets.forEach(p => this.selectedPresetIds.add(p.id));
          // Expand the first preset folder by default
          if (presets.length > 0 && this.expandedPresetIds.size === 0) {
            this.expandedPresetIds.add(presets[0].id);
          }
        }
      },
      error: (err) => console.error('Error fetching presets:', err)
    });
  }

  setMode(mode: 'live' | 'edit') {
    this.currentMode = mode;
    this.showPeriodForm = false;
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

  toggleFolder(id: string) {
    if (this.expandedPresetIds.has(id)) {
      this.expandedPresetIds.delete(id);
    } else {
      this.expandedPresetIds.add(id);
    }
  }

  isFolderExpanded(id: string): boolean {
    return this.expandedPresetIds.has(id);
  }

  createPreset() {
    if (!this.newPresetName) return;
    this.presetsService.createPreset({ name: this.newPresetName }).subscribe({
      next: (preset) => {
        this.presets.unshift(preset); // Put it at the top
        this.selectedPresetIds.add(preset.id);
        this.expandedPresetIds.add(preset.id); // Auto-expand new folders
        this.newPresetName = '';
      },
      error: (err) => console.error('Error creating preset:', err)
    });
  }

  deletePreset(id: string) {
    if (!confirm('Are you sure you want to delete this preset and all its dates?')) return;
    this.presetsService.deletePreset(id).subscribe({
      next: () => {
        this.presets = this.presets.filter(p => p.id !== id);
        this.selectedPresetIds.delete(id);
        this.expandedPresetIds.delete(id);
      },
      error: (err) => console.error('Error deleting preset:', err)
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

  // Period / Date editing functions
  openAddPeriod(presetId: string) {
    this.activePresetIdForPeriod = presetId;
    this.editingPeriodId = null;
    this.periodFormModel = {
      name: '',
      startDate: '',
      endDate: '',
      color: '#3b82f6',
      noteType: '',
      noteContent: ''
    };
    this.showPeriodForm = true;
  }

  openEditPeriod(period: Period, presetId: string) {
    this.activePresetIdForPeriod = presetId;
    this.editingPeriodId = period.id;
    this.periodFormModel = {
      name: period.name,
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      color: period.color || '#3b82f6',
      noteType: period.noteType || '',
      noteContent: period.noteContent || ''
    };
    this.showPeriodForm = true;
  }

  savePeriod() {
    const model = this.periodFormModel;
    if (!model.name || !model.startDate || !model.endDate) return;

    const payload = {
      name: model.name,
      startDate: model.startDate,
      endDate: model.endDate,
      color: model.color,
      presetId: this.activePresetIdForPeriod,
      noteType: model.noteType || null,
      noteContent: model.noteContent || null
    };

    if (this.editingPeriodId) {
      this.periodsService.updatePeriod(this.editingPeriodId, payload).subscribe({
        next: () => {
          this.showPeriodForm = false;
          this.loadPresetsAndSelectAll();
        },
        error: (err) => alert(err.error?.message || 'Failed to update event.')
      });
    } else {
      this.periodsService.createPeriod(payload).subscribe({
        next: () => {
          this.showPeriodForm = false;
          this.loadPresetsAndSelectAll();
        },
        error: (err) => alert(err.error?.message || 'Failed to create event.')
      });
    }
  }

  deletePeriod(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    this.periodsService.deletePeriod(id).subscribe({
      next: () => {
        this.loadPresetsAndSelectAll();
      },
      error: (err) => console.error('Error deleting event:', err)
    });
  }

  // Calendar Click & Date Range Selection Callbacks
  onCalendarEventClicked(periodId: string) {
    for (const preset of this.presets) {
      const period = (preset.periods || []).find(p => p.id === periodId);
      if (period) {
        this.openEditPeriod(period, preset.id);
        break;
      }
    }
  }

  onCalendarDateRangeSelected(range: {start: Date, end: Date}) {
    // Select the first expanded folder, or first folder, or let user pick inside the form
    let defaultPresetId = '';
    if (this.expandedPresetIds.size > 0) {
      defaultPresetId = Array.from(this.expandedPresetIds)[0];
    } else if (this.presets.length > 0) {
      defaultPresetId = this.presets[0].id;
    }

    this.activePresetIdForPeriod = defaultPresetId;
    this.editingPeriodId = null;

    const startStr = this.formatDateToLocalYYYYMMDD(range.start);
    const endStr = this.formatDateToLocalYYYYMMDD(range.end);

    this.periodFormModel = {
      name: '',
      startDate: startStr,
      endDate: endStr,
      color: '#3b82f6',
      noteType: '',
      noteContent: ''
    };
    this.showPeriodForm = true;
  }

  private formatDateToLocalYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
