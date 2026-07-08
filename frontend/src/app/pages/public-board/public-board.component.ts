import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-board',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page hero">
      <h1 class="hero-title gradient-text">Lemon Seasons</h1>
      <p class="hero-subtitle">Year at a Glance</p>
      <div style="margin-top: 32px">
        <a routerLink="/login" class="btn-primary">Login</a>
      </div>
    </div>
  `,
})
export class PublicBoardComponent {}
