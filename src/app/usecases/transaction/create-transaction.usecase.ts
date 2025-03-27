import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, finalize, catchError, switchMap, map } from 'rxjs/operators';
import { CreateTransactionRequest, TransactionResponse } from '../../models/transaction.model';
import { TransactionsService } from '../../core/services/transactions.service';
import { TransactionStore, AccountStore } from '../../store';
import { GetAccountsUseCase } from '../account/get-accounts.usecase';
import { GetAccountDetailsUseCase } from '../account/get-account-details.usecase';

@Injectable({
  providedIn: 'root'
})
export class CreateTransactionUseCase {
  private transactionsService = inject(TransactionsService);
  private transactionStore = inject(TransactionStore);
  private accountStore = inject(AccountStore);
  private getAccountsUseCase = inject(GetAccountsUseCase);
  private getAccountDetailsUseCase = inject(GetAccountDetailsUseCase);

  execute(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    console.log('CreateTransactionUseCase: Creating transaction', transaction);
    // Indiquer que l'opération est en cours
    this.transactionStore.setLoading(true);

    return this.transactionsService.createTransaction(transaction).pipe(
      tap(response => {
        console.log('CreateTransactionUseCase: Transaction created successfully', response);

        // Ajouter la transaction créée au store
        if (response && response.id) {
          this.transactionStore.addTransaction(response);
        }
      }),
      switchMap(response => {
        // Rafraîchir les comptes pour mettre à jour les soldes
        console.log('CreateTransactionUseCase: Refreshing accounts after transaction');
        return this.getAccountsUseCase.execute().pipe(
          map(() => {
            // Si l'une des parties de la transaction est le compte actuellement sélectionné,
            // assurons-nous qu'il est correctement mis à jour
            const selectedAccount = this.accountStore.getState().selectedAccount;
            if (selectedAccount &&
              (selectedAccount.id === transaction.emitterAccountId ||
                selectedAccount.id === transaction.receiverAccountId)) {
              console.log('CreateTransactionUseCase: Account involved in transaction is currently selected, refreshing details');
              // Recharger les détails du compte sélectionné
              this.getAccountDetailsUseCase.execute(selectedAccount.id).subscribe();
            }

            // Retourner la réponse originale
            return response;
          }),
          catchError(error => {
            console.error('CreateTransactionUseCase: Error refreshing accounts', error);
            // Même en cas d'erreur de rafraîchissement des comptes, on continue
            return new Observable<TransactionResponse>(observer => {
              observer.next(response);
              observer.complete();
            });
          })
        );
      }),
      catchError(error => {
        console.error('CreateTransactionUseCase: Error creating transaction', error);
        this.transactionStore.setError(error.message || 'Erreur lors de la création de la transaction');
        throw error;
      }),
      finalize(() => {
        // Indiquer que l'opération est terminée
        this.transactionStore.setLoading(false);
      })
    );
  }
}
