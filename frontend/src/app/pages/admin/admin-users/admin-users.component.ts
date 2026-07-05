import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page admin-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          <p class="page-subtitle">Manage user accounts and roles</p>
        </div>
        <span class="badge">{{ users.length }} users</span>
      </div>

      <div class="admin-table-card">
        @if (loading) {
          <div class="loading-state"><div class="spinner"></div></div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name / Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users; track user.id) {
                <tr [class.current-user]="user.id === currentUserId">
                  <td>
                    <div class="table-avatar" [class.admin-avatar]="user.role === 'ADMIN'">
                      {{ getInitial(user) }}
                    </div>
                  </td>
                  <td>
                    <div class="user-info-cell">
                      <span class="user-display-name">{{ user.name || '—' }}</span>
                      <span class="user-email-small">{{ user.email }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="role-badge" [class.admin-badge]="user.role === 'ADMIN'">
                      {{ user.role }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date: 'MMM d, y' }}</td>
                  <td class="actions-cell">
                    @if (user.id !== currentUserId) {
                      @if (user.role === 'USER') {
                        <button
                          class="btn-sm btn-promote"
                          (click)="updateRole(user, 'ADMIN')"
                          title="Promote to Admin"
                        >
                          Promote
                        </button>
                      } @else {
                        <button
                          class="btn-sm btn-demote"
                          (click)="updateRole(user, 'USER')"
                          title="Demote to User"
                        >
                          Demote
                        </button>
                      }
                    } @else {
                      <span class="you-badge">You</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-row">No users found.</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  users: User[] = [];
  loading = true;
  currentUserId = this.authService.currentUser?.id;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  updateRole(user: User, role: 'USER' | 'ADMIN') {
    const action = role === 'ADMIN' ? 'promote' : 'demote';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`)) return;

    this.adminService.updateUserRole(user.id, role).subscribe({
      next: () => this.loadUsers(),
    });
  }

  getInitial(user: User): string {
    if (user.name) return user.name[0].toUpperCase();
    return user.email[0].toUpperCase();
  }
}
