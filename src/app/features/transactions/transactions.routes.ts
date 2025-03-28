import {Routes} from '@angular/router';
import {authGuard} from '../../core/authentication/auth.guard';

export const TRANSACTIONS_ROUTES: Routes = [
  // Routes existantes...
  {
    path: 'history',
    loadComponent: () => import('./pages/transaction-history/transaction-history.component')
      .then(c => c.TransactionHistoryComponent),
    canActivate: [authGuard]
  },
  // Nouvelle route
  {
    path: 'details/:id',
    loadComponent: () => import('./pages/transaction-details/transaction-details.component')
      .then(c => c.TransactionDetailsComponent),
    canActivate: [authGuard]
  }
];
