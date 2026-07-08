import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period } from '@/models';

@Component({
  selector: 'app-period-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './period-card.component.html',
  styleUrls: ['./period-card.component.css']
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
