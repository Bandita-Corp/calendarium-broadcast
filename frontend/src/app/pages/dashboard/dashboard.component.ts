import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { PresetsService } from '@/services/presets.service';
import { PeriodsService } from '@/services/periods.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CalendarViewComponent } from '@/components/calendar-view/calendar-view.component';
import { TimelineBarComponent } from '@/components/timeline-bar/timeline-bar.component';
import { DatePickerComponent } from '@/components/date-picker/date-picker.component';
import { NoteViewModalComponent } from '@/components/note-view-modal/note-view-modal.component';
import { Preset, Period } from '@/models';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CalendarViewComponent,
    TimelineBarComponent,
    DatePickerComponent,
    NoteViewModalComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  presetsService = inject(PresetsService);
  periodsService = inject(PeriodsService);
  translate = inject(TranslateService);
  private router = inject(Router);

  presets: Preset[] = [];
  selectedPresetIds = new Set<string>();
  expandedPresetIds = new Set<string>();
  newPresetName = '';
  currentMode: 'live' | 'edit' = 'live';
  currentYear = new Date().getFullYear();
  viewSubMode: 'timeline' | 'calendar' = 'timeline';
  dropdownOpen = false;
  selectedDate: Date | null = null;

  // View Modal fields
  showViewModal = false;
  viewModalPeriod: Period | null = null;

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
    hashtags: [] as string[],
    hasTime: false,
    startTime: '09:00',
    endTime: '10:00',
    isSingleNote: false
  };

  ngOnInit() {
    this.loadPresetsAndSelectAll(true);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateModeFromUrl();
    });
    this.updateModeFromUrl();
  }

  updateModeFromUrl() {
    const url = this.router.url;
    if (url.includes('/dashboard/work')) {
      this.currentMode = 'edit';
    } else if (url.includes('/dashboard/live/timeline')) {
      this.currentMode = 'live';
      this.viewSubMode = 'timeline';
    } else if (url.includes('/dashboard/live/calendar')) {
      this.currentMode = 'live';
      this.viewSubMode = 'calendar';
    }
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
    if (mode === 'edit') {
      this.router.navigate(['/dashboard/work']);
    } else {
      this.router.navigate([`/dashboard/live/${this.viewSubMode}`]);
    }
    this.showPeriodForm = false;
  }

  setSubMode(subMode: 'timeline' | 'calendar') {
    this.router.navigate([`/dashboard/live/${subMode}`]);
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
      const end = p.endDate ? new Date(p.endDate) : null;
      if (end) {
        end.setHours(23, 59, 59, 999);
      }
      
      return today >= start && (!end || today <= end);
    });
  }

  // Period / Date editing functions
  openAddPeriodFromCalendar() {
    this.openAddPeriodForDate(new Date());
  }

  openAddPeriodForDate(date: Date) {
    let defaultPresetId = '';
    if (this.expandedPresetIds.size > 0) {
      defaultPresetId = Array.from(this.expandedPresetIds)[0];
    } else if (this.presets.length > 0) {
      defaultPresetId = this.presets[0].id;
    }

    const dateStr = this.formatDateToLocalYYYYMMDD(date);

    this.activePresetIdForPeriod = defaultPresetId;
    this.editingPeriodId = null;
    this.periodFormModel = {
      name: '',
      startDate: dateStr,
      endDate: '',
      color: '#3b82f6',
      noteType: 'Period',
      noteContent: '',
      hashtags: [],
      hasTime: false,
      startTime: '09:00',
      endTime: '10:00',
      isSingleNote: false
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
      hashtags: [],
      hasTime: false,
      startTime: '09:00',
      endTime: '10:00',
      isSingleNote: false
    };
    this.newHashtagText = '';
    this.showPeriodForm = true;
  }

  openEditPeriod(period: Period, presetId: string) {
    this.activePresetIdForPeriod = presetId;
    this.editingPeriodId = period.id;
    
    const start = new Date(period.startDate);
    const end = period.endDate ? new Date(period.endDate) : null;
    const hasTime = end ? !(
      (start.getHours() === 0 && start.getMinutes() === 0) &&
      ((end.getHours() === 23 && end.getMinutes() === 59) || (end.getHours() === 0 && end.getMinutes() === 0))
    ) : false;
    const startTimeStr = this.formatTime(start);
    const endTimeStr = end ? this.formatTime(end) : '10:00';

    // Determine if it was saved as a single note (start date and end date are the same day)
    let isSingleNote = false;
    if (end) {
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      isSingleNote = (startDay.getTime() === endDay.getTime());
    }

    this.periodFormModel = {
      name: period.name,
      startDate: this.formatDateToLocalYYYYMMDD(start),
      endDate: end ? this.formatDateToLocalYYYYMMDD(end) : '',
      color: period.color || '#3b82f6',
      noteType: period.noteType || 'Period',
      noteContent: period.noteContent || '',
      hashtags: period.hashtags ? [...period.hashtags] : [],
      hasTime: hasTime,
      startTime: hasTime ? startTimeStr : '09:00',
      endTime: hasTime ? endTimeStr : '10:00',
      isSingleNote: isSingleNote
    };
    this.newHashtagText = '';
    this.showPeriodForm = true;
  }

  savePeriod() {
    const model = this.periodFormModel;
    if (!model.name || !model.startDate) return;

    if (model.isSingleNote) {
      model.endDate = model.startDate;
      if (model.hasTime) {
        model.endTime = model.startTime;
      }
    }

    let startDateISO: string;
    let endDateISO: string | null = null;

    if (model.endDate) {
      if (model.hasTime) {
        startDateISO = this.parseDateAndTime(model.startDate, model.startTime || '09:00');
        endDateISO = this.parseDateAndTime(model.endDate, model.endTime || '10:00');
      } else {
        startDateISO = this.parseDateOnly(model.startDate, false);
        endDateISO = this.parseDateOnly(model.endDate, true);
      }
    } else {
      if (model.hasTime) {
        startDateISO = this.parseDateAndTime(model.startDate, model.startTime || '09:00');
      } else {
        startDateISO = this.parseDateOnly(model.startDate, false);
      }
      endDateISO = null;
    }

    const payload = {
      name: model.name,
      startDate: startDateISO,
      endDate: endDateISO,
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
        this.openViewPeriod(period);
        break;
      }
    }
  }

  openViewPeriod(period: Period) {
    this.viewModalPeriod = period;
    this.showViewModal = true;
  }

  closeViewPeriod() {
    this.showViewModal = false;
    this.viewModalPeriod = null;
  }

  handleViewModalEdit(periodId: string) {
    this.closeViewPeriod();
    for (const preset of this.presets) {
      const period = (preset.periods || []).find(p => p.id === periodId);
      if (period) {
        this.openEditPeriod(period, preset.id);
        break;
      }
    }
  }

  onCalendarAddClicked(date: Date) {
    this.openAddPeriodForDate(date);
  }

  onCalendarDateSelected(date: Date) {
    this.selectedDate = date;
  }

  getSelectedDateLabel(): string {
    const date = this.selectedDate || new Date();
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
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
      case 'done': return '✅';
      case 'trend': return '📈';
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
      const end = p.endDate ? new Date(p.endDate) : null;
      if (end) {
        end.setHours(23, 59, 59, 999);
      }
      
      return target >= start && (!end || target <= end);
    });
  }

  onCalendarDateRangeSelected(range: {start: Date, end: Date}) {
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

    const isSingle = startStr === endStr;
    this.periodFormModel = {
      name: '',
      startDate: startStr,
      endDate: endStr,
      color: '#3b82f6',
      noteType: 'Period',
      noteContent: '',
      hashtags: [],
      hasTime: false,
      startTime: '09:00',
      endTime: '10:00',
      isSingleNote: isSingle
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

  onSingleNoteChange() {
    if (this.periodFormModel.isSingleNote) {
      this.periodFormModel.endDate = this.periodFormModel.startDate;
      this.periodFormModel.endTime = this.periodFormModel.startTime;
    }
  }

  onStartDateChange(newDate: string) {
    if (this.periodFormModel.isSingleNote) {
      this.periodFormModel.endDate = newDate;
    }
  }

  onStartTimeChange(newTime: string) {
    if (this.periodFormModel.isSingleNote) {
      this.periodFormModel.endTime = newTime;
    }
  }

  private formatDateToLocalYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  hasTime(period: Period): boolean {
    if (!period || !period.startDate || !period.endDate) return false;
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return !(
      (start.getHours() === 0 && start.getMinutes() === 0) &&
      ((end.getHours() === 23 && end.getMinutes() === 59) || (end.getHours() === 0 && end.getMinutes() === 0))
    );
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private parseDateAndTime(dateStr: string, timeStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date.toISOString();
  }

  private parseDateOnly(dateStr: string, isEnd: boolean): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isEnd) {
      const date = new Date(year, month - 1, day, 23, 59, 59, 999);
      return date.toISOString();
    } else {
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      return date.toISOString();
    }
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
