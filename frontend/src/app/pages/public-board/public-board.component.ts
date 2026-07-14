import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PeriodsService } from '@/services/periods.service';
import { PresetsService } from '@/services/presets.service';
import { Period, Preset } from '@/models';
import { TimelineBarComponent } from '@/components/timeline-bar/timeline-bar.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-public-board',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TimelineBarComponent, TranslateModule],
  templateUrl: './public-board.component.html',
  styleUrl: './public-board.component.css',
})
export class PublicBoardComponent implements OnInit {
  private periodsService = inject(PeriodsService);
  private presetsService = inject(PresetsService);

  periods: Period[] = [];
  presets: Preset[] = [];
  selectedPresetId: string | null = null;
  loading = true;
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.loadPresets();
    this.loadPeriods();
  }

  loadPresets() {
    this.presetsService.getPublicPresets().subscribe({
      next: (presets) => {
        this.presets = presets;
      },
      error: (err) => {
        console.error('Failed to load public presets:', err);
      }
    });
  }

  loadPeriods() {
    this.loading = true;
    this.periodsService.getPublicPeriods(this.selectedPresetId || undefined).subscribe({
      next: (periods) => {
        this.periods = periods;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPresetChange() {
    this.loadPeriods();
  }
}
