import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '@/models';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-period-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './period-card.component.html',
  styleUrls: ['./period-card.component.css']
})
export class PeriodCardComponent {
  @Input() period!: Period;
  @Input() isActive = false;

  getDuration(period: Period): number | string {
    if (!period.endDate) return '-';
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
