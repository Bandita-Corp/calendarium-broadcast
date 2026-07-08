import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '@/models';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isFirstDayOfMonth: boolean;
  periods: Period[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarViewComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() year: number = new Date().getFullYear();
  
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() dateRangeSelected = new EventEmitter<{start: Date, end: Date}>();

  allWeeks: (CalendarDay | null)[][] = [];
  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  selectionStart: Date | null = null;
  hoveredDate: Date | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['periods'] || changes['year']) {
      this.buildCalendar();
    }
  }

  private buildCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfYear = new Date(this.year, 0, 1);
    const lastDayOfYear = new Date(this.year, 11, 31);
    
    let currentWeek: (CalendarDay | null)[] = new Array(7).fill(null);
    this.allWeeks = [];

    // Fill initial empty days
    for (let i = 0; i < firstDayOfYear.getDay(); i++) {
      currentWeek[i] = null;
    }

    let currentDate = new Date(firstDayOfYear);
    
    while (currentDate <= lastDayOfYear) {
      const dayOfWeek = currentDate.getDay();
      
      const dayToday = new Date();
      dayToday.setHours(0, 0, 0, 0);
      const isToday = currentDate.getTime() === dayToday.getTime();
      const isFirstDayOfMonth = currentDate.getDate() === 1;

      const currentMs = currentDate.getTime();
      const periods = this.periods.filter((p) => {
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.endDate).getTime();
        return currentMs >= start && currentMs <= end;
      });

      currentWeek[dayOfWeek] = {
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isToday,
        isFirstDayOfMonth,
        periods,
      };

      if (dayOfWeek === 6 || currentDate.getTime() === lastDayOfYear.getTime()) {
        this.allWeeks.push(currentWeek);
        currentWeek = new Array(7).fill(null);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  onDayClick(date: Date) {
    if (!this.selectionStart) {
      // Start a new selection
      this.selectionStart = date;
      this.dateSelected.emit(date);
    } else {
      // Complete the range selection
      const start = this.selectionStart < date ? this.selectionStart : date;
      const end = this.selectionStart > date ? this.selectionStart : date;
      
      this.dateRangeSelected.emit({ start, end });
      
      // Reset selection for next time
      this.selectionStart = null;
      this.hoveredDate = null;
    }
  }

  onDayHover(date: Date) {
    if (this.selectionStart) {
      this.hoveredDate = date;
    }
  }

  isSelected(date: Date): boolean {
    if (!this.selectionStart) return false;
    if (this.hoveredDate) return false; // Handled by isInRange when hovering
    return date.getTime() === this.selectionStart.getTime();
  }

  isInRange(date: Date): boolean {
    if (!this.selectionStart || !this.hoveredDate) return false;
    const start = this.selectionStart < this.hoveredDate ? this.selectionStart : this.hoveredDate;
    const end = this.selectionStart > this.hoveredDate ? this.selectionStart : this.hoveredDate;
    
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
  }
}

