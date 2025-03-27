import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, finalize, catchError } from 'rxjs/operators';
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
    console.log(`GetTransactionsUseCase: Fetching transactions for account ${accountId}`);
    this.transactionStore.setLoading(true);

    return this.transactionsService.getTransactionsByAccountId(accountId).pipe(
      tap(transactions => {
        console.log(`GetTransactionsUseCase: Received ${transactions.length} transactions for account ${accountId}`);

        if (transactions.length > 0) {
          // Mise à jour du store avec les transactions chargées
          // Important: nous gardons les transactions précédentes en les fusionnant avec les nouvelles
          this.updateTransactionsInStore(transactions);
        } else {
          console.log(`GetTransactionsUseCase: No transactions found for account ${accountId}`);
        }

        this.transactionStore.setError(null);
      }),
      catchError(error => {
        console.error(`GetTransactionsUseCase: Error fetching transactions for account ${accountId}`, error);
        this.transactionStore.setError('Impossible de charger les transactions');
        return of([]); // Retourner un tableau vide en cas d'erreur
      }),
      finalize(() => {
        this.transactionStore.setLoading(false);
      })
    );
  }

  private updateTransactionsInStore(newTransactions: Transaction[]): void {
    // Récupérer les transactions existantes
    const currentTransactions = this.transactionStore.getState().transactions;
    console.log(`GetTransactionsUseCase: Currently ${currentTransactions.length} transactions in store`);

    // Créer un Map des transactions existantes par ID pour une recherche rapide
    const existingTransactionsMap = new Map<string, boolean>();
    currentTransactions.forEach(t => existingTransactionsMap.set(t.id, true));

    // Ajouter uniquement les nouvelles transactions (éviter les doublons)
    const transactionsToAdd = newTransactions.filter(t => !existingTransactionsMap.has(t.id));

    if (transactionsToAdd.length > 0) {
      console.log(`GetTransactionsUseCase: Adding ${transactionsToAdd.length} new transactions to store`);

      // Fusionner les transactions existantes avec les nouvelles
      const mergedTransactions = [...currentTransactions, ...transactionsToAdd];

      // Mettre à jour le store
      this.transactionStore.setTransactions(mergedTransactions);

      // Log pour vérifier
      console.log(`GetTransactionsUseCase: Store now has ${mergedTransactions.length} transactions total`);
    } else {
      console.log('GetTransactionsUseCase: No new transactions to add to store');
    }
  }
}
