import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/admin/users');
  }

  updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    return this.http.patch<User>(`/api/admin/users/${id}/role`, { role });
  }
}
