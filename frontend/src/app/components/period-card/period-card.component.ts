import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '../../models';

@Component({
  selector: 'app-period-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="period-card" [class.active]="isActive" [style.border-left-color]="period.color">
      <div class="period-color-bar" [style.background-color]="period.color"></div>
      <div class="period-card-body">
        <div class="period-header">
          <h3 class="period-name">{{ period.name }}</h3>
          @if (isActive) {
            <span class="active-badge">
              <span class="pulse-dot"></span>
              Active
            </span>
          }
        </div>
        <div class="period-dates">
          <span class="date-range">
            {{ period.startDate | date: 'MMM d, y' }}
            &rarr;
            {{ period.endDate | date: 'MMM d, y' }}
          </span>
        </div>
        <div class="period-duration">
          {{ getDuration(period) }} days
        </div>
      </div>
    </div>
  `,
})
export class PeriodCardComponent {
  @Input() period!: Period;
  @Input() isActive = false;

  getDuration(period: Period): number {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}
