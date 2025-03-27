import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Transaction } from '../../models/transaction.model';
import { TransactionsService } from '../../core/services/transactions.service';
import { TransactionStore } from '../../store';

@Injectable({
  providedIn: 'root'
})
export class GetTransactionsUseCase {
  private transactionsService = inject(TransactionsService);
  private transactionStore = inject(TransactionStore);

  execute(accountId: string): Observable<Transaction[]> {
    this.transactionStore.setLoading(true);

    return this.transactionsService.getTransactionsByAccountId(accountId).pipe(
      tap({
        next: (transactions) => {
          this.transactionStore.setTransactions(transactions);
          this.transactionStore.setLoading(false);
          this.transactionStore.setError(null);
        },
        error: (error) => {
          this.transactionStore.setLoading(false);
          this.transactionStore.setError('Impossible de charger les transactions');
          console.error('Error fetching transactions:', error);
        }
      })
    );
  }
}
