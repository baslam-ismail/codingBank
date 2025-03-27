import { Routes } from '@angular/router';
import { authGuard } from '../../core/authentication/auth.guard';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () => import('./pages/new-transaction/new-transaction.component')
      .then(c => c.NewTransactionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/transaction-history/transaction-history.component')
      .then(c => c.TransactionHistoryComponent),
    canActivate: [authGuard]
  }
];
