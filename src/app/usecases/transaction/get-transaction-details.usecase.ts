import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Transaction } from '../../models/transaction.model';
import { TransactionsService } from '../../core/services/transactions.service';
import { TransactionStore } from '../../store';

@Injectable({
  providedIn: 'root'
})
export class GetTransactionDetailsUseCase {
  private transactionsService = inject(TransactionsService);
  private transactionStore = inject(TransactionStore);

  execute(transactionId: string): Observable<Transaction | null> {
    this.transactionStore.setLoading(true);
    console.log(`GetTransactionDetailsUseCase: Fetching details for transaction ${transactionId}`);

    return this.transactionsService.getTransactionById(transactionId).pipe(
      tap({
        next: (transaction) => {
          console.log(`GetTransactionDetailsUseCase: Transaction details received:`, transaction);
          this.transactionStore.setError(null);
        },
        error: (error) => {
          console.error('GetTransactionDetailsUseCase: Error fetching transaction details:', error);
          this.transactionStore.setError('Impossible de charger les détails de la transaction');
        }
      }),
      finalize(() => {
        this.transactionStore.setLoading(false);
      })
    );
  }
}
