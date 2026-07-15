import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '@/models';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

interface TimelineBlock {
  period: Period;
  leftPercent: number;
  widthPercent: number;
  row: number;
}

@Component({
  selector: 'app-timeline-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './timeline-bar.component.html',
  styleUrls: ['./timeline-bar.component.css']
})
export class TimelineBarComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() year: number = new Date().getFullYear();

  private translate = inject(TranslateService);

  blocks: TimelineBlock[] = [];
  todayPercent = -1;
  trackHeight = 80;
  months: { label: string, leftPercent: number }[] = [];

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.computeMonths();
    });
    this.computeMonths();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['periods'] || changes['year']) {
      this.computeBlocks();
      this.computeToday();
      this.computeMonths();
    }
  }

  private computeMonths() {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    
    this.months = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(this.year, i, 1);
      const label = date.toLocaleDateString(locale, { month: 'short' });
      // Capitalize first letter for consistency in ru
      const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
      return {
        label: capitalized,
        leftPercent: (i / 12) * 100
      };
    });
  }

  private computeBlocks() {
    const yearStart = new Date(this.year, 0, 1).getTime();
    const yearEnd = new Date(this.year, 11, 31, 23, 59, 59).getTime();
    const yearMs = yearEnd - yearStart;

    const rows: { end: number }[] = [];

    this.blocks = this.periods.map((period) => {
      const start = Math.max(new Date(period.startDate).getTime(), yearStart);
      const end = period.endDate
        ? Math.min(new Date(period.endDate).getTime(), yearEnd)
        : yearEnd;

      const leftPercent = ((start - yearStart) / yearMs) * 100;
      const widthPercent = ((end - start) / yearMs) * 100;

      // Find a non-overlapping row
      let row = 0;
      while (rows[row] && rows[row].end > start) {
        row++;
      }
      rows[row] = { end: end };

      return { period, leftPercent, widthPercent, row };
    });

    const maxRow = this.blocks.reduce((m, b) => Math.max(m, b.row), 0);
    this.trackHeight = (maxRow + 1) * 44 + 16;
  }

  private computeToday() {
    const yearStart = new Date(this.year, 0, 1).getTime();
    const yearEnd = new Date(this.year, 11, 31, 23, 59, 59).getTime();
    const now = Date.now();
    this.todayPercent = ((now - yearStart) / (yearEnd - yearStart)) * 100;
  }

  formatDate(dateStr: string): string {
    const lang = this.translate.currentLang || this.translate.defaultLang || 'en';
    const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  }
}
