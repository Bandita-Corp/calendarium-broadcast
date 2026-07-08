import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '@/services/admin.service';
import { AuthService } from '@/services/auth.service';
import { User } from '@/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
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
