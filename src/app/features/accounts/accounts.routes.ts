import { Routes } from '@angular/router';
import { authGuard } from '../../core/authentication/auth.guard';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/accounts-list/accounts-list.component')
      .then(c => c.AccountsListComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/account-details/account-details.component')
      .then(c => c.AccountDetailsComponent),
    canActivate: [authGuard]
  }
];
