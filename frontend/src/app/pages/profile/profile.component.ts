import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  currentUser: User | null = null;
  stats: any = null;
  activeTab: 'profile' | 'stats' = 'profile';

  loading = false;
  successMsg = '';
  errorMsg = '';

  form = this.fb.group({
    name: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.maxLength(100)]],
  });

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.form.patchValue({
          name: user.name || '',
          email: user.email || '',
        });
      }
    });

    this.authService.stats$.subscribe((stats) => {
      this.stats = stats;
    });

    // Load statistics
    this.authService.fetchStats().subscribe();
  }

  setTab(tab: 'profile' | 'stats') {
    this.activeTab = tab;
    this.successMsg = '';
    this.errorMsg = '';
  }

  getInitial(user: User): string {
    if (user.name) return user.name[0].toUpperCase();
    return user.email[0].toUpperCase();
  }

  getBarWidth(count: number): string {
    if (!this.stats || this.stats.totalLogged === 0) return '0%';
    const maxCount = Math.max(...Object.values(this.stats.typeDistribution) as number[], 1);
    const percentage = (count / maxCount) * 100;
    return `${percentage}%`;
  }

  getTypeDistributionArray(): { key: string; value: number }[] {
    if (!this.stats || !this.stats.typeDistribution) return [];
    return Object.entries(this.stats.typeDistribution).map(([key, value]) => ({
      key,
      value: value as number,
    }));
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    const payload: Record<string, any> = {
      email: this.form.value.email!,
      name: this.form.value.name || '',
    };

    if (this.form.value.password) {
      payload['password'] = this.form.value.password;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Profile updated successfully!';
        this.form.patchValue({ password: '' }); // Clear password input
        // Refresh stats
        this.authService.fetchStats().subscribe();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to update profile. Please try again.';
      },
    });
  }
}
