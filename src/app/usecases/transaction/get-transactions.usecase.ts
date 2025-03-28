import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, catchError, finalize, mergeMap, map } from 'rxjs/operators';
import { Transaction } from '../../models/transaction.model';
import { Account } from '../../models/account.model';
import { TransactionsService } from '../../core/services/transactions.service';
import { AccountsService } from '../../core/services/accounts.service';
import { TransactionStore } from '../../store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GetTransactionsUseCase {
  private transactionsService = inject(TransactionsService);
  private accountsService = inject(AccountsService);
  private transactionStore = inject(TransactionStore);

  /**
   * Exécute le cas d'utilisation pour récupérer toutes les transactions
   * @returns Observable des transactions chargées
   */
  execute(): Observable<Transaction[]> {
    console.log('GetTransactionsUseCase: Fetching all transactions');
    this.transactionStore.setLoading(true);

    // En mode démo, utiliser le service de transaction directement
    if (environment.demo) {
      return this.transactionsService.getAllTransactions().pipe(
        tap(transactions => {
          // @ts-ignore
          console.log(`GetTransactionsUseCase: Loaded ${transactions.length} transactions in demo mode`);
          // @ts-ignore
          this.transactionStore.setTransactions(transactions);
          this.transactionStore.setError(null);
        }),
        catchError(error => {
          console.error('GetTransactionsUseCase: Error fetching transactions in demo mode', error);
          this.transactionStore.setError('Impossible de charger les transactions');
          return of([]);
        }),
        finalize(() => {
          this.transactionStore.setLoading(false);
        })
      );
    }

    // En mode API, récupérer d'abord tous les comptes, puis les transactions de chaque compte
    return this.accountsService.getAccounts().pipe(
      mergeMap(accounts => {
        if (accounts.length === 0) {
          console.log('GetTransactionsUseCase: No accounts found');
          this.transactionStore.setTransactions([]);
          this.transactionStore.setLoading(false);
          return of([]);
        }

        console.log(`GetTransactionsUseCase: Found ${accounts.length} accounts, fetching their transactions`);

        // Pour chaque compte, récupérer ses transactions
        const transactionRequests = accounts.map(account =>
          this.transactionsService.getTransactionsByAccountId(account.id).pipe(
            catchError(error => {
              console.warn(`Error fetching transactions for account ${account.id}`, error);
              return of([]);
            })
          )
        );

        // Combiner toutes les transactions
        return forkJoin(transactionRequests).pipe(
          map(transactionsArrays => {
            // Fusionner tous les tableaux de transactions
            const allTransactions = transactionsArrays.flat();
            console.log(`GetTransactionsUseCase: Combined ${allTransactions.length} transactions from all accounts`);

            // Mettre à jour le store
            this.transactionStore.setTransactions(allTransactions);
            this.transactionStore.setError(null);

            return allTransactions;
          }),
          catchError(error => {
            console.error('GetTransactionsUseCase: Error combining transactions', error);
            this.transactionStore.setError('Erreur lors de la récupération des transactions');
            return of([]);
          }),
          finalize(() => {
            this.transactionStore.setLoading(false);
          })
        );
      }),
      catchError(error => {
        console.error('GetTransactionsUseCase: Error fetching accounts', error);
        this.transactionStore.setError('Impossible de charger les comptes');
        this.transactionStore.setLoading(false);
        return of([]);
      })
    );
  }

  // Version qui charge par compte (si besoin)
  executeForAccount(accountId: string): Observable<Transaction[]> {
    console.log(`GetTransactionsUseCase: Fetching transactions for account ${accountId}`);
    this.transactionStore.setLoading(true);

    return this.transactionsService.getTransactionsByAccountId(accountId).pipe(
      tap(transactions => {
        console.log(`GetTransactionsUseCase: Loaded ${transactions.length} transactions for account`);
        this.transactionStore.setTransactions(transactions);
        this.transactionStore.setError(null);
      }),
      catchError(error => {
        console.error('GetTransactionsUseCase: Error fetching transactions', error);
        this.transactionStore.setError('Impossible de charger les transactions');
        return of([]);
      }),
      finalize(() => {
        this.transactionStore.setLoading(false);
      })
    );
  }


}
