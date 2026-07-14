import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preset } from '@/models';

@Injectable({
  providedIn: 'root',
})
export class PresetsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/presets';

  getPresets(): Observable<Preset[]> {
    return this.http.get<Preset[]>(this.apiUrl);
  }

  getPreset(id: string): Observable<Preset> {
    return this.http.get<Preset>(`${this.apiUrl}/${id}`);
  }

  createPreset(data: Partial<Preset>): Observable<Preset> {
    return this.http.post<Preset>(this.apiUrl, data);
  }

  updatePreset(id: string, data: Partial<Preset>): Observable<Preset> {
    return this.http.patch<Preset>(`${this.apiUrl}/${id}`, data);
  }

  deletePreset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPublicPresets(): Observable<Preset[]> {
    return this.http.get<Preset[]>('/api/public/presets');
  }
}
