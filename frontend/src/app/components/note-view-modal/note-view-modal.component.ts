import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Period, Preset } from '@/models';

@Component({
  selector: 'app-note-view-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './note-view-modal.component.html',
  styleUrls: ['./note-view-modal.component.css']
})
export class NoteViewModalComponent implements OnChanges {
  @Input() period: Period | null = null;
  @Input() presets: Preset[] = [];
  @Input() isEditable: boolean = false;
  @Input() year: number = new Date().getFullYear();

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  private translate = inject(TranslateService);

  isSingleDate = false;
  isDateRange = false;
  isOngoingRange = false;
  durationDays = 0;
  
  timelineStartPercent = 0;
  timelineWidthPercent = 0;
  months: { label: string, leftPercent: number }[] = [];

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.computeMonths();
    });
    this.computeMonths();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period'] || changes['year'] || changes['presets']) {
      this.analyzePeriod();
    }
  }

  private computeMonths() {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    
    this.months = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(this.year, i, 1);
      const label = date.toLocaleDateString(locale, { month: 'short' });
      // Capitalize first letter
      const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
      return {
        label: capitalized,
        leftPercent: (i / 12) * 100
      };
    });
  }

  private analyzePeriod() {
    if (!this.period) return;

    const start = new Date(this.period.startDate);
    const end = this.period.endDate ? new Date(this.period.endDate) : null;

    // 1. Determine Type
    if (!end) {
      this.isOngoingRange = true;
      this.isSingleDate = false;
      this.isDateRange = false;
      this.durationDays = 0;
    } else {
      this.isOngoingRange = false;
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      if (startDay.getTime() === endDay.getTime()) {
        this.isSingleDate = true;
        this.isDateRange = false;
        this.durationDays = 1;
      } else {
        this.isSingleDate = false;
        this.isDateRange = true;
        // Calculate duration in days (inclusive)
        const diffTime = Math.abs(endDay.getTime() - startDay.getTime());
        this.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    // 2. Timeline Calculations
    const yearStart = new Date(this.year, 0, 1).getTime();
    const yearEnd = new Date(this.year, 11, 31, 23, 59, 59, 999).getTime();
    const yearMs = yearEnd - yearStart;

    const noteStart = start.getTime();
    const noteEnd = end ? end.getTime() : yearEnd;

    // Bound within the target year
    const boundStart = Math.max(yearStart, Math.min(yearEnd, noteStart));
    const boundEnd = Math.max(yearStart, Math.min(yearEnd, noteEnd));

    this.timelineStartPercent = ((boundStart - yearStart) / yearMs) * 100;
    this.timelineWidthPercent = ((boundEnd - boundStart) / yearMs) * 100;
    
    // Ensure minimum width for visibility if range is very short
    if (!this.isSingleDate && this.timelineWidthPercent < 1.5) {
      this.timelineWidthPercent = 1.5;
    }
  }

  get noteTypeIcon(): string {
    if (!this.period || !this.period.noteType) return '📝';
    switch (this.period.noteType.toLowerCase()) {
      case 'period': return '📅';
      case 'vibe': return '✨';
      case 'impression': return '💭';
      case 'event': return '🎈';
      case 'done': return '✅';
      case 'trend': return '📈';
      default: return '📝';
    }
  }

  get presetName(): string {
    if (!this.period || !this.period.presetId) return '';
    const preset = this.presets.find(p => p.id === this.period?.presetId);
    return preset ? preset.name : '';
  }

  hasTime(): boolean {
    if (!this.period) return false;
    const start = new Date(this.period.startDate);
    const end = this.period.endDate ? new Date(this.period.endDate) : null;
    if (!end) return false;
    return !(
      (start.getHours() === 0 && start.getMinutes() === 0) &&
      ((end.getHours() === 23 && end.getMinutes() === 59) || (end.getHours() === 0 && end.getMinutes() === 0))
    );
  }

  onClose() {
    this.close.emit();
  }

  onEdit() {
    if (this.period) {
      this.edit.emit(this.period.id);
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.onClose();
  }
}
