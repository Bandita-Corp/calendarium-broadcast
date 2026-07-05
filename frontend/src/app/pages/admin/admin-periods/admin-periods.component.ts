import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PeriodsService } from '../../../services/periods.service';
import { Period } from '../../../models';

@Component({
  selector: 'app-admin-periods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Periods</h1>
          <p class="page-subtitle">Manage named timeframes on the annual timeline</p>
        </div>
        <button class="btn-primary" (click)="openCreateForm()">+ New Period</button>
      </div>

      <!-- Create / Edit Form -->
      @if (showForm) {
        <div class="admin-form-card">
          <h2 class="form-title">{{ editingId ? 'Edit Period' : 'Create Period' }}</h2>
          <form [formGroup]="periodForm" (ngSubmit)="onSubmit()" class="period-form">
            @if (formError) {
              <div class="alert alert-error">{{ formError }}</div>
            }

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" formControlName="name" placeholder="e.g. Spring Bloom" />
              </div>
              <div class="form-group">
                <label class="form-label">Color</label>
                <div class="color-input-wrap">
                  <input type="color" class="color-picker" formControlName="color" />
                  <span class="color-value">{{ periodForm.value.color }}</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" class="form-input" formControlName="startDate" />
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" class="form-input" formControlName="endDate" />
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-outline" (click)="cancelForm()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="periodForm.invalid || saving">
                @if (saving) { Saving... } @else { {{ editingId ? 'Update' : 'Create' }} }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Periods Table -->
      <div class="admin-table-card">
        @if (loading) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (period of periods; track period.id) {
                <tr [class.active-row]="isPeriodActive(period)">
                  <td>
                    <span class="color-dot" [style.background-color]="period.color"></span>
                  </td>
                  <td class="period-name-cell">{{ period.name }}</td>
                  <td>{{ period.startDate | date: 'MMM d, y' }}</td>
                  <td>{{ period.endDate | date: 'MMM d, y' }}</td>
                  <td>{{ getDuration(period) }}d</td>
                  <td>
                    @if (isPeriodActive(period)) {
                      <span class="status-badge active">Active</span>
                    } @else if (isFuture(period)) {
                      <span class="status-badge upcoming">Upcoming</span>
                    } @else {
                      <span class="status-badge past">Past</span>
                    }
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon edit" (click)="editPeriod(period)" title="Edit">✏️</button>
                    <button class="btn-icon delete" (click)="deletePeriod(period.id)" title="Delete">🗑️</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-row">No periods yet. Create your first one!</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class AdminPeriodsComponent implements OnInit {
  private periodsService = inject(PeriodsService);
  private fb = inject(FormBuilder);

  periods: Period[] = [];
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
  });

  ngOnInit() {
    this.loadPeriods();
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
    this.periodForm.reset({ color: '#FFD700' });
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
}
