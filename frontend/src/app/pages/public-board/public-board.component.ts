import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PeriodsService } from '@/services/periods.service';
import { Period } from '@/models';
import { TimelineBarComponent } from '@/components/timeline-bar/timeline-bar.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-public-board',
  standalone: true,
  imports: [CommonModule, RouterLink, TimelineBarComponent, TranslateModule],
  templateUrl: './public-board.component.html',
  styleUrl: './public-board.component.css',
})
export class PublicBoardComponent implements OnInit {
  private periodsService = inject(PeriodsService);

  periods: Period[] = [];
  loading = true;
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.periodsService.getPeriods().subscribe({
      next: (periods) => {
        // Just show all active periods for now, or filter by a default preset if one exists later.
        this.periods = periods;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
