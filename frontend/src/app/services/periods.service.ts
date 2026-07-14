import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Period } from '@/models';

@Injectable({ providedIn: 'root' })
export class PeriodsService {
  private http = inject(HttpClient);

  getPeriods() {
    return this.http.get<Period[]>('/api/periods');
  }

  getPeriod(id: string) {
    return this.http.get<Period>(`/api/periods/${id}`);
  }

  createPeriod(data: any) {
    return this.http.post<Period>('/api/periods', data);
  }

  updatePeriod(id: string, data: any) {
    return this.http.patch<Period>(`/api/periods/${id}`, data);
  }

  deletePeriod(id: string) {
    return this.http.delete(`/api/periods/${id}`);
  }

  getPublicPeriods(presetId?: string) {
    const params: Record<string, string> = {};
    if (presetId) {
      params['presetId'] = presetId;
    }
    return this.http.get<Period[]>('/api/public/periods', { params });
  }
}
