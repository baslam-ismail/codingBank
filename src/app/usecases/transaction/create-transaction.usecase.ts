// src/app/usecases/transaction/create-transaction.usecase.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { CreateTransactionRequest, TransactionResponse } from '../../models/transaction.model';
import { TransactionsService } from '../../core/services/transactions.service';
import { TransactionStore } from '../../store';
import { DataUpdateService } from '../../core/services/data-update.service';

@Injectable({
  providedIn: 'root'
})
export class CreateTransactionUseCase {
  private transactionsService = inject(TransactionsService);
  private transactionStore = inject(TransactionStore);
  private dataUpdateService = inject(DataUpdateService);

  execute(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    // Indiquer que l'opération est en cours
    this.transactionStore.setLoading(true);

    return this.transactionsService.createTransaction(transaction).pipe(
      tap({
        next: (response) => {
          console.log('Transaction créée avec succès:', response);

          // Notifier que les comptes et transactions doivent être mis à jour
          this.notifyDataChanged(transaction);
          this.transactionStore.setError(null);
        },
        error: (error) => {
          console.error('Erreur lors de la création de la transaction:', error);
          this.transactionStore.setError(error.message || 'Erreur lors de la création de la transaction');
        }
      }),
      finalize(() => {
        // Indiquer que l'opération est terminée
        this.transactionStore.setLoading(false);
      })
    );
  }

  private notifyDataChanged(transaction: CreateTransactionRequest): void {
    // Notifier que les comptes et transactions doivent être mis à jour
    this.dataUpdateService.notifyAccountsUpdated();
    this.dataUpdateService.notifyTransactionsUpdated(transaction.emitterAccountId);
    if (transaction.receiverAccountId !== transaction.emitterAccountId) {
      this.dataUpdateService.notifyTransactionsUpdated(transaction.receiverAccountId);
    }
  }
}
