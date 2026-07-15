import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export interface MacroTrigger {
  noteType: string;
  color: string;
  isSingleNote: boolean;
  durationDays?: number;
}

@Injectable({ providedIn: 'root' })
export class MacroService {
  private router = inject(Router);
  private macroTrigger$ = new Subject<MacroTrigger>();
  macroTriggerAction$ = this.macroTrigger$.asObservable();

  triggerMacro(trigger: MacroTrigger) {
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/dashboard/work')) {
      this.router.navigate(['/dashboard/work']).then(() => {
        // Wait for the DashboardComponent to initialize
        setTimeout(() => {
          this.macroTrigger$.next(trigger);
        }, 150);
      });
    } else {
      this.macroTrigger$.next(trigger);
    }
  }
}
