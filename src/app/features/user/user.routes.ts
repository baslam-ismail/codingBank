import { Routes } from '@angular/router';
import { authGuard } from '../../core/authentication/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./pages/user-profile/user-profile.component')
      .then(c => c.UserProfileComponent),
    canActivate: [authGuard]
  }
];
