import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { PresetsService } from '@/services/presets.service';
import { PeriodsService } from '@/services/periods.service';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarViewComponent } from '@/components/calendar-view/calendar-view.component';
import { TimelineBarComponent } from '@/components/timeline-bar/timeline-bar.component';
import { DatePickerComponent } from '@/components/date-picker/date-picker.component';
import { Preset, Period } from '@/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CalendarViewComponent,
    TimelineBarComponent,
    DatePickerComponent
  ],
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
  currentYear = new Date().getFullYear();
  viewSubMode: 'timeline' | 'calendar' = 'timeline';
  dropdownOpen = false;
  selectedDate: Date | null = null;

  // Period Form fields
  showPeriodForm = false;
  editingPeriodId: string | null = null;
  activePresetIdForPeriod = '';
  selectedTagFilter: string | null = null;
  newHashtagText = '';
  periodFormModel = {
    name: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6',
    noteType: 'Period',
    noteContent: '',
    hashtags: [] as string[]
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
    const list = this.presets
      .filter(p => this.selectedPresetIds.has(p.id))
      .flatMap(p => p.periods || []);
    
    if (this.selectedTagFilter) {
      const filter = this.selectedTagFilter.toLowerCase();
      return list.filter(p => 
        (p.hashtags || []).some(t => t.toLowerCase() === filter)
      );
    }
    return list;
  }

  get activeFolderTags(): string[] {
    const tags = new Set<string>();
    this.presets
      .filter(p => this.selectedPresetIds.has(p.id))
      .flatMap(p => p.periods || [])
      .forEach(period => {
        if (period.hashtags) {
          period.hashtags.forEach(tag => tags.add(tag.toLowerCase()));
        }
      });
    return Array.from(tags).sort();
  }

  toggleTagFilter(tag: string) {
    if (this.selectedTagFilter === tag) {
      this.selectedTagFilter = null;
    } else {
      this.selectedTagFilter = tag;
    }
  }

  clearTagFilter() {
    this.selectedTagFilter = null;
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
  openAddPeriodFromCalendar() {
    let defaultPresetId = '';
    if (this.expandedPresetIds.size > 0) {
      defaultPresetId = Array.from(this.expandedPresetIds)[0];
    } else if (this.presets.length > 0) {
      defaultPresetId = this.presets[0].id;
    }

    const todayStr = this.formatDateToLocalYYYYMMDD(new Date());

    this.activePresetIdForPeriod = defaultPresetId;
    this.editingPeriodId = null;
    this.periodFormModel = {
      name: '',
      startDate: todayStr,
      endDate: todayStr,
      color: '#3b82f6',
      noteType: 'Period',
      noteContent: '',
      hashtags: []
    };
    this.newHashtagText = '';
    this.showPeriodForm = true;
  }

  openAddPeriod(presetId: string) {
    this.activePresetIdForPeriod = presetId;
    this.editingPeriodId = null;
    this.periodFormModel = {
      name: '',
      startDate: '',
      endDate: '',
      color: '#3b82f6',
      noteType: 'Period',
      noteContent: '',
      hashtags: []
    };
    this.newHashtagText = '';
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
      noteType: period.noteType || 'Period',
      noteContent: period.noteContent || '',
      hashtags: period.hashtags ? [...period.hashtags] : []
    };
    this.newHashtagText = '';
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
      presetId: this.activePresetIdForPeriod || null,
      noteType: model.noteType || null,
      noteContent: model.noteContent || null,
      hashtags: model.hashtags || []
    };

    if (this.editingPeriodId) {
      this.periodsService.updatePeriod(this.editingPeriodId, payload).subscribe({
        next: () => {
          this.showPeriodForm = false;
          this.loadPresetsAndSelectAll();
        },
        error: (err) => alert(err.error?.message || 'Failed to update note.')
      });
    } else {
      this.periodsService.createPeriod(payload).subscribe({
        next: () => {
          this.showPeriodForm = false;
          this.loadPresetsAndSelectAll();
        },
        error: (err) => alert(err.error?.message || 'Failed to create note.')
      });
    }
  }

  deletePeriod(id: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    this.periodsService.deletePeriod(id).subscribe({
      next: () => {
        this.loadPresetsAndSelectAll();
      },
      error: (err) => console.error('Error deleting note:', err)
    });
  }

  // Calendar Click & Date Range Selection Callbacks
  onCalendarEventClicked(periodId: string) {
    for (const preset of this.presets) {
      const period = (preset.periods || []).find(p => p.id === periodId);
      if (period) {
        this.selectedDate = new Date(period.startDate);
        this.openEditPeriod(period, preset.id);
        break;
      }
    }
  }

  onCalendarDateSelected(date: Date) {
    this.selectedDate = date;
  }

  getSelectedDateLabel(): string {
    const date = this.selectedDate || new Date();
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  clearSelectedDate() {
    this.selectedDate = null;
  }

  getPresetNameForPeriod(period: Period): string {
    const preset = this.presets.find(p => p.id === period.presetId);
    return preset ? preset.name : 'Global';
  }

  getNoteTypeIcon(type?: string): string {
    if (!type) return '📅';
    switch (type.toLowerCase()) {
      case 'period': return '📅';
      case 'vibe': return '✨';
      case 'impression': return '💭';
      case 'event': return '🎈';
      default: return '📝';
    }
  }

  openEditPeriodForFeed(period: Period) {
    const presetId = period.presetId || '';
    this.openEditPeriod(period, presetId);
  }

  get activePeriodsForSelectedDate(): Period[] {
    const targetDate = this.selectedDate || new Date();
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    return this.displayedPeriods.filter(p => {
      const start = new Date(p.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(p.endDate);
      end.setHours(23, 59, 59, 999);
      
      return target >= start && target <= end;
    });
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
      noteType: 'Period',
      noteContent: '',
      hashtags: []
    };
    this.newHashtagText = '';
    this.showPeriodForm = true;
  }

  addHashtag(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const raw = this.newHashtagText.trim().replace(/^#/, '');
    if (raw && !this.periodFormModel.hashtags.includes(raw)) {
      this.periodFormModel.hashtags.push(raw);
    }
    this.newHashtagText = '';
  }

  removeHashtag(index: number) {
    this.periodFormModel.hashtags.splice(index, 1);
  }

  selectNoteType(type: string) {
    this.periodFormModel.noteType = type;
  }

  private formatDateToLocalYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Multiselect Dropdown Handlers
  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  getSelectedPresetsLabel(): string {
    if (this.selectedPresetIds.size === 0) {
      return 'Select Folders';
    }
    if (this.selectedPresetIds.size === this.presets.length) {
      return 'All Folders Selected';
    }
    if (this.selectedPresetIds.size === 1) {
      const firstId = Array.from(this.selectedPresetIds)[0];
      const preset = this.presets.find(p => p.id === firstId);
      return preset ? preset.name : '1 Folder Selected';
    }
    return `${this.selectedPresetIds.size} Folders Selected`;
  }

  selectAllPresets(event: MouseEvent) {
    event.stopPropagation();
    this.presets.forEach(p => this.selectedPresetIds.add(p.id));
  }

  deselectAllPresets(event: MouseEvent) {
    event.stopPropagation();
    this.selectedPresetIds.clear();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.multiselect-container')) {
      this.dropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.showPeriodForm) {
      this.showPeriodForm = false;
    }
  }
}
