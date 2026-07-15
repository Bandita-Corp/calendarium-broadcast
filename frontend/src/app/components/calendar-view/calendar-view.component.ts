import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import { TranslateModule } from '@ngx-translate/core';
import { Period, Preset } from '@/models';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, CalendarModule, TranslateModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarViewComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() presets: Preset[] = [];
  @Input() year: number = new Date().getFullYear();
  @Input() isEditable: boolean = false;
  
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() dateRangeSelected = new EventEmitter<{start: Date, end: Date}>();
  @Output() eventClicked = new EventEmitter<string>();
  @Output() addClicked = new EventEmitter<Date>();

  @ViewChild('calendarWrapper', { static: false }) calendarWrapper!: ElementRef;

  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  selectionStart: Date | null = null;

  selectedDate: Date | null = null;
  showPopup = false;
  popupPosition = { top: 0, left: 0 };
  allEventTitlesVisible: boolean = true;

  private elementRef = inject(ElementRef);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['year']) {
      // Sync viewDate to the selected year
      this.viewDate = new Date(this.year, this.viewDate.getMonth(), 1);
    }
    if (changes['periods'] || changes['year']) {
      this.buildEvents();
    }
  }

  private buildEvents() {
    this.events = this.periods.map((p) => {
      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : new Date(this.year, 11, 31, 23, 59, 59);
      return {
        id: p.id,
        title: p.name,
        start,
        end,
        allDay: true,
        color: {
          primary: p.color,
          secondary: p.color + '22', // Light color for block backgrounds
        },
      };
    });
  }

  dayClicked(day: any, sourceEvent?: MouseEvent | KeyboardEvent): void {
    const date = day.date;
    this.selectedDate = date;
    this.dateSelected.emit(date);

    if (this.dateRangeSelected.observed) {
      if (!this.selectionStart) {
        this.selectionStart = date;
      } else {
        const start = this.selectionStart < date ? this.selectionStart : date;
        const end = this.selectionStart > date ? this.selectionStart : date;
        this.dateRangeSelected.emit({ start, end });
        this.selectionStart = null;
        this.closePopup();
        return;
      }
    }

    if (sourceEvent && sourceEvent instanceof MouseEvent && this.calendarWrapper) {
      const targetEl = sourceEvent.target as HTMLElement;
      const cellEl = targetEl.closest('.cal-day-cell') as HTMLElement;
      if (cellEl) {
        const wrapperEl = this.calendarWrapper.nativeElement as HTMLElement;
        this.calculatePopupPosition(cellEl, wrapperEl);
        this.showPopup = true;
      } else {
        this.showPopup = false;
      }
    } else {
      this.showPopup = false;
    }
  }

  onEventClicked({ event }: { event: CalendarEvent }): void {
    if (event.id) {
      this.eventClicked.emit(event.id as string);
    }
  }

  get activePeriodsForSelectedDate(): Period[] {
    if (!this.selectedDate) return [];
    const target = new Date(this.selectedDate);
    target.setHours(0, 0, 0, 0);

    return this.periods.filter(p => {
      const start = new Date(p.startDate);
      start.setHours(0, 0, 0, 0);
      const end = p.endDate ? new Date(p.endDate) : null;
      if (end) {
        end.setHours(23, 59, 59, 999);
      }
      
      return target >= start && (!end || target <= end);
    });
  }

  getPresetNameForPeriod(period: Period): string {
    if (!this.presets) return 'Global';
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

  calculatePopupPosition(cellEl: HTMLElement, wrapperEl: HTMLElement) {
    const cellRect = cellEl.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();

    const cellWidth = cellRect.width;
    const cellHeight = cellRect.height;
    
    const popupWidth = 320; 
    const popupHeight = 350; // Max height in pixels

    // Center horizontally relative to cell
    let left = (cellRect.left - wrapperRect.left) + (cellWidth / 2) - (popupWidth / 2);
    // Position below the cell (with 8px spacing)
    let top = (cellRect.bottom - wrapperRect.top) + 8;

    // Boundary check right
    if (left + popupWidth > wrapperRect.width) {
      left = wrapperRect.width - popupWidth - 12;
    }
    // Boundary check left
    if (left < 12) {
      left = 12;
    }

    // Boundary check bottom (flip above cell if it overflows bottom)
    if (top + popupHeight > wrapperRect.height) {
      const topCandidate = (cellRect.top - wrapperRect.top) - popupHeight - 8;
      if (topCandidate > 12) {
        top = topCandidate;
      } else {
        // If it overflows both, place it at the top margin and let CSS handle max-height constraints
        top = 12;
      }
    }

    this.popupPosition = { top, left };
  }

  closePopup() {
    this.showPopup = false;
    this.selectedDate = null;
  }

  viewPeriod(periodId: string, event: MouseEvent) {
    event.stopPropagation();
    this.eventClicked.emit(periodId);
    this.closePopup();
  }

  editPeriod(periodId: string, event: MouseEvent) {
    event.stopPropagation();
    this.eventClicked.emit(periodId); // We can let parent decide if it should open edit or view
    this.closePopup();
  }

   addPeriod(date: Date, event: MouseEvent) {
    event.stopPropagation();
    this.addClicked.emit(date);
    this.closePopup();
  }

  isEventTitleVisible(eventId?: string | number): boolean {
    return this.allEventTitlesVisible;
  }

  toggleEventTitle(eventId?: string | number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.allEventTitlesVisible = !this.allEventTitlesVisible;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showPopup) return;
    
    const target = event.target as HTMLElement;
    const clickedInsidePopup = target.closest('.calendar-popup-container');
    const clickedDayCell = target.closest('.cal-day-cell');
    const clickedControls = target.closest('.calendar-controls');

    if (!clickedInsidePopup && !clickedDayCell && !clickedControls) {
      this.closePopup();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.showPopup) {
      this.closePopup();
    }
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
}
