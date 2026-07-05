import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '../../models';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  periods: Period[];
}

interface CalendarMonth {
  name: string;
  year: number;
  month: number;
  weeks: CalendarDay[][];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-grid">
      @for (cal of calendarMonths; track cal.month) {
        <div class="cal-month">
          <div class="cal-month-header">
            <span class="cal-month-name">{{ cal.name }}</span>
            <span class="cal-month-year">{{ cal.year }}</span>
          </div>
          <div class="cal-weekdays">
            @for (d of weekdays; track d) {
              <div class="cal-weekday">{{ d }}</div>
            }
          </div>
          @for (week of cal.weeks; track $index) {
            <div class="cal-week">
              @for (day of week; track $index) {
                <div
                  class="cal-day"
                  [class.today]="day.isToday"
                  [class.other-month]="!day.isCurrentMonth"
                  [class.has-period]="day.periods.length > 0"
                >
                  <span class="cal-day-num">{{ day.dayNumber }}</span>
                  @if (day.periods.length > 0) {
                    <div class="day-dots">
                      @for (p of day.periods.slice(0,3); track p.id) {
                        <span class="dot" [style.background-color]="p.color" [title]="p.name"></span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CalendarViewComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() year: number = new Date().getFullYear();

  calendarMonths: CalendarMonth[] = [];
  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['periods'] || changes['year']) {
      this.buildCalendar();
    }
  }

  private buildCalendar() {
    const today = new Date();
    this.calendarMonths = [];

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(this.year, m, 1);
      const lastDay = new Date(this.year, m + 1, 0);

      // Pad start
      const startPad = firstDay.getDay();
      const days: CalendarDay[] = [];

      for (let i = startPad; i > 0; i--) {
        const d = new Date(this.year, m, 1 - i);
        days.push(this.buildDay(d, false, today));
      }

      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(this.year, m, d);
        days.push(this.buildDay(date, true, today));
      }

      // Pad end to complete last week
      const endPad = 6 - lastDay.getDay();
      for (let i = 1; i <= endPad; i++) {
        const d = new Date(this.year, m + 1, i);
        days.push(this.buildDay(d, false, today));
      }

      // Split into weeks
      const weeks: CalendarDay[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
      }

      this.calendarMonths.push({
        name: this.monthNames[m],
        year: this.year,
        month: m,
        weeks,
      });
    }
  }

  private buildDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const periods = this.periods.filter((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return date >= start && date <= end;
    });

    return {
      date,
      dayNumber: date.getDate(),
      isToday,
      isCurrentMonth,
      periods,
    };
  }
}
