import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnChanges {
  @Input() value: string = ''; // YYYY-MM-DD
  @Output() valueChange = new EventEmitter<string>();
  @Input() placeholder: string = 'Select Date';
  @Input() align: 'left' | 'right' = 'left';

  private elementRef = inject(ElementRef);
  private translate = inject(TranslateService);

  isOpen = false;
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  getWeekdays(): string[] {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    if (lang === 'ru') {
      return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    }
    return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  }

  getCurrentMonthHeader(): string {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    const month = this.currentMonth.getMonth();
    const year = this.currentMonth.getFullYear();
    const months: Record<string, string[]> = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    };
    const list = months[lang] || months['en'];
    return `${list[month]} ${year}`;
  }

  getDisplayValue(): string {
    if (!this.value) return '';
    const parsed = this.parseDate(this.value);
    if (!parsed) return '';
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    if (lang === 'ru') {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}.${month}.${year}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      const parsed = this.parseDate(this.value);
      if (parsed) {
        this.currentMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      } else {
        this.currentMonth = new Date();
      }
      this.buildCalendarDays();
    }
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const parsed = this.parseDate(this.value);
      if (parsed) {
        this.currentMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      } else {
        this.currentMonth = new Date();
      }
      this.buildCalendarDays();
    }
  }

  prevMonth(event: MouseEvent) {
    event.stopPropagation();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.buildCalendarDays();
  }

  nextMonth(event: MouseEvent) {
    event.stopPropagation();
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.buildCalendarDays();
  }

  selectDay(date: Date, event: MouseEvent) {
    event.stopPropagation();
    const formatted = this.formatDate(date);
    this.value = formatted;
    this.valueChange.emit(formatted);
    this.isOpen = false;
  }

  clearValue(event: MouseEvent) {
    event.stopPropagation();
    this.value = '';
    this.valueChange.emit('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  private parseDate(val: string): Date | null {
    if (!val) return null;
    const parts = val.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  private isSelected(date: Date): boolean {
    if (!this.value) return false;
    const sel = this.parseDate(this.value);
    return !!sel &&
           date.getDate() === sel.getDate() &&
           date.getMonth() === sel.getMonth() &&
           date.getFullYear() === sel.getFullYear();
  }

  private buildCalendarDays() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevTotalDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isToday(d),
        isSelected: this.isSelected(d)
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: this.isToday(d),
        isSelected: this.isSelected(d)
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: this.isToday(d),
        isSelected: this.isSelected(d)
      });
    }

    this.calendarDays = days;
  }
}
