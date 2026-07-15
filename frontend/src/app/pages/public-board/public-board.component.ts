import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PeriodsService } from '@/services/periods.service';
import { PresetsService } from '@/services/presets.service';
import { Period, Preset } from '@/models';
import { TimelineBarComponent } from '@/components/timeline-bar/timeline-bar.component';
import { CalendarViewComponent } from '@/components/calendar-view/calendar-view.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-public-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TimelineBarComponent,
    CalendarViewComponent,
    TranslateModule
  ],
  templateUrl: './public-board.component.html',
  styleUrl: './public-board.component.css',
})
export class PublicBoardComponent implements OnInit {
  private periodsService = inject(PeriodsService);
  private presetsService = inject(PresetsService);

  presets: Preset[] = [];
  selectedPresetIds = new Set<string>();
  expandedPresetIds = new Set<string>();
  
  loading = true;
  currentYear = new Date().getFullYear();
  viewMode: 'timeline' | 'calendar' = 'timeline';
  dropdownOpen = false;
  selectedDate: Date | null = null;

  ngOnInit() {
    this.loadPresets();
  }

  loadPresets() {
    this.loading = true;
    this.presetsService.getPublicPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
        // Select all presets by default
        presets.forEach(p => this.selectedPresetIds.add(p.id));
        // Expand the first folder by default
        if (presets.length > 0) {
          this.expandedPresetIds.add(presets[0].id);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load public presets:', err);
        this.loading = false;
      }
    });
  }

  selectedTagFilter: string | null = null;

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

  // Accordion Folder Handlers
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdown on click outside
    const target = event.target as HTMLElement;
    if (!target.closest('.multiselect-container')) {
      this.dropdownOpen = false;
    }
  }

  onCalendarDateSelected(date: Date) {
    this.selectedDate = date;
  }

  onCalendarEventClicked(periodId: string) {
    for (const preset of this.presets) {
      const period = (preset.periods || []).find(p => p.id === periodId);
      if (period) {
        this.selectedDate = new Date(period.startDate);
        break;
      }
    }
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
}

