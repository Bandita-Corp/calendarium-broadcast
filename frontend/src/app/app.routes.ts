import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from '@/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public-board/public-board.component').then(
        (m) => m.PublicBoardComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'work',
      },
      {
        path: 'work',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'live/timeline',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'live/calendar',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'live/trends',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
    ],
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full',
      },
      {
        path: 'board',
        loadComponent: () =>
          import('./pages/admin/admin-board/admin-board.component').then(
            (m) => m.AdminBoardComponent,
          ),
      },
      {
        path: 'periods',
        loadComponent: () =>
          import('./pages/admin/admin-periods/admin-periods.component').then(
            (m) => m.AdminPeriodsComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
