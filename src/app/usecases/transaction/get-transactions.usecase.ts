// src/app/usecases/transaction/get-transactions.usecase.ts

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
          // Mise à jour du store avec les transactions chargées
          // Éviter d'écraser d'autres transactions pour d'autres comptes
          this.updateTransactionsInStore(transactions, accountId);

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

  private updateTransactionsInStore(newTransactions: Transaction[], accountId: string): void {
    // Récupérer les transactions existantes
    let currentTransactions: Transaction[] = [];
    this.transactionStore.selectTransactions().subscribe(transactions => {
      currentTransactions = transactions;
    });

    // Supprimer les transactions existantes pour ce compte
    const otherTransactions = currentTransactions.filter(
      t => t.emitterAccountId !== accountId && t.receiverAccountId !== accountId
    );

    // Ajouter les nouvelles transactions
    const mergedTransactions = [...otherTransactions, ...newTransactions];

    // Mettre à jour le store
    this.transactionStore.setTransactions(mergedTransactions);
  }
}
