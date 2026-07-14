import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PeriodsService } from '@/services/periods.service';
import { PresetsService } from '@/services/presets.service';
import { Period, Preset } from '@/models';

@Component({
  selector: 'app-admin-periods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-periods.component.html',
  styleUrl: './admin-periods.component.css',
})
export class AdminPeriodsComponent implements OnInit {
  private periodsService = inject(PeriodsService);
  private presetsService = inject(PresetsService);
  private fb = inject(FormBuilder);

  periods: Period[] = [];
  presets: Preset[] = [];
  loading = true;
  showForm = false;
  saving = false;
  editingId: string | null = null;
  formError = '';

  periodForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    color: ['#FFD700'],
    presetId: [''],
  });

  ngOnInit() {
    this.loadPresets();
    this.loadPeriods();
  }

  loadPresets() {
    this.presetsService.getPresets().subscribe({
      next: (p) => (this.presets = p),
      error: (err) => console.error('Failed to load presets:', err),
    });
  }

  loadPeriods() {
    this.loading = true;
    this.periodsService.getPeriods().subscribe({
      next: (p) => {
        this.periods = p;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openCreateForm() {
    this.editingId = null;
    this.periodForm.reset({ color: '#FFD700', presetId: '' });
    this.formError = '';
    this.showForm = true;
  }

  editPeriod(period: Period) {
    this.editingId = period.id;
    this.periodForm.patchValue({
      name: period.name,
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      color: period.color,
      presetId: period.presetId || '',
    });
    this.formError = '';
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
  }

  onSubmit() {
    if (this.periodForm.invalid) return;
    this.saving = true;
    this.formError = '';

    const payload = {
      name: this.periodForm.value.name!,
      startDate: this.periodForm.value.startDate!,
      endDate: this.periodForm.value.endDate!,
      color: this.periodForm.value.color!,
      presetId: this.periodForm.value.presetId || null,
    };

    const request = this.editingId
      ? this.periodsService.updatePeriod(this.editingId, payload)
      : this.periodsService.createPeriod(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.editingId = null;
        this.loadPeriods();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Failed to save period.';
      },
    });
  }

  deletePeriod(id: string) {
    if (!confirm('Delete this period?')) return;
    this.periodsService.deletePeriod(id).subscribe({
      next: () => this.loadPeriods(),
    });
  }

  getDuration(period: Period): number {
    return Math.ceil(
      (new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  isPeriodActive(period: Period): boolean {
    const now = new Date();
    return new Date(period.startDate) <= now && new Date(period.endDate) >= now;
  }

  isFuture(period: Period): boolean {
    return new Date(period.startDate) > new Date();
  }

  getPresetName(presetId?: string): string {
    if (!presetId) return '';
    const preset = this.presets.find((p) => p.id === presetId);
    return preset ? preset.name : '';
  }
}
