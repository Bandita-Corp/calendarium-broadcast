import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '../../models';

interface TimelineBlock {
  period: Period;
  leftPercent: number;
  widthPercent: number;
  row: number;
}

@Component({
  selector: 'app-timeline-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <div class="timeline-months">
        @for (month of months; track month.label) {
          <div class="month-label" [style.left.%]="month.leftPercent">
            {{ month.label }}
          </div>
        }
      </div>

      <div class="timeline-track" [style.height.px]="trackHeight">
        <!-- Month grid lines -->
        @for (month of months; track month.label) {
          <div class="month-line" [style.left.%]="month.leftPercent"></div>
        }

        <!-- Today indicator -->
        @if (todayPercent >= 0 && todayPercent <= 100) {
          <div class="today-line" [style.left.%]="todayPercent">
            <div class="today-label">Today</div>
          </div>
        }

        <!-- Period blocks -->
        @for (block of blocks; track block.period.id) {
          <div
            class="period-block"
            [style.left.%]="block.leftPercent"
            [style.width.%]="block.widthPercent"
            [style.top.px]="block.row * 44 + 8"
            [style.background-color]="block.period.color"
            [title]="block.period.name + ' (' + formatDate(block.period.startDate) + ' – ' + formatDate(block.period.endDate) + ')'"
          >
            <span class="block-label">{{ block.period.name }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class TimelineBarComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() year: number = new Date().getFullYear();

  blocks: TimelineBlock[] = [];
  todayPercent = -1;
  trackHeight = 80;

  months = [
    { label: 'Jan', leftPercent: 0 },
    { label: 'Feb', leftPercent: 8.33 },
    { label: 'Mar', leftPercent: 16.67 },
    { label: 'Apr', leftPercent: 25 },
    { label: 'May', leftPercent: 33.33 },
    { label: 'Jun', leftPercent: 41.67 },
    { label: 'Jul', leftPercent: 50 },
    { label: 'Aug', leftPercent: 58.33 },
    { label: 'Sep', leftPercent: 66.67 },
    { label: 'Oct', leftPercent: 75 },
    { label: 'Nov', leftPercent: 83.33 },
    { label: 'Dec', leftPercent: 91.67 },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['periods'] || changes['year']) {
      this.computeBlocks();
      this.computeToday();
    }
  }

  private computeBlocks() {
    const yearStart = new Date(this.year, 0, 1).getTime();
    const yearEnd = new Date(this.year, 11, 31, 23, 59, 59).getTime();
    const yearMs = yearEnd - yearStart;

    const rows: { end: number }[] = [];

    this.blocks = this.periods.map((period) => {
      const start = Math.max(new Date(period.startDate).getTime(), yearStart);
      const end = Math.min(new Date(period.endDate).getTime(), yearEnd);

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
