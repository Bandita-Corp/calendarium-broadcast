import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import { Period } from '@/models';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, CalendarModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarViewComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() year: number = new Date().getFullYear();
  
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() dateRangeSelected = new EventEmitter<{start: Date, end: Date}>();
  @Output() eventClicked = new EventEmitter<string>();

  viewDate: Date = new Date();
  events: CalendarEvent[] = [];
  selectionStart: Date | null = null;

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
      const end = new Date(p.endDate);
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

  dayClicked({ date }: { date: Date }): void {
    if (!this.selectionStart) {
      this.selectionStart = date;
      this.dateSelected.emit(date);
    } else {
      const start = this.selectionStart < date ? this.selectionStart : date;
      const end = this.selectionStart > date ? this.selectionStart : date;
      this.dateRangeSelected.emit({ start, end });
      this.selectionStart = null;
    }
  }

  onEventClicked({ event }: { event: CalendarEvent }): void {
    if (event.id) {
      this.eventClicked.emit(event.id as string);
    }
  }
}
