import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionsState } from '../store.types';
import { Transaction } from '../../models/transaction.model';

const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class TransactionStore {
  private state = new BehaviorSubject<TransactionsState>(initialState);

  // Sélecteurs
  get state$(): Observable<TransactionsState> {
    return this.state.asObservable();
  }

  resetState(): void {
    console.log('TransactionStore: Resetting state completely');
    this.state.next({
      transactions: [],
      loading: false,
      error: null
    });
  }

  selectTransactions(): Observable<Transaction[]> {
    return this.state$.pipe(map(state => {
      console.log('TransactionStore: Returning all transactions:', state.transactions);
      return state.transactions;
    }));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(state => state.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(state => state.error));
  }

  selectTransactionsByAccountId(accountId: string): Observable<Transaction[]> {
    console.log(`TransactionStore: Selecting transactions for account ${accountId}`);
    return this.selectTransactions().pipe(
      map(transactions => {
        // Log pour voir toutes les transactions actuellement dans le store
        console.log(`TransactionStore: All transactions in store:`,
          transactions.map(t => {
            // Logique de filtrage plus robuste pour supporter différentes structures
            const emitterId = t.emitter?.id || t.emitterAccountId;
            const receiverId = t.receiver?.id || t.receiverAccountId;
            return {id: t.id, emitter: emitterId, receiver: receiverId};
          }));

        // Filtrage plus robuste pour supporter différentes structures
        const filteredTransactions = transactions.filter(t => {
          const emitterId = t.emitter?.id || t.emitterAccountId;
          const receiverId = t.receiver?.id || t.receiverAccountId;
          return emitterId === accountId || receiverId === accountId;
        });

        console.log(`TransactionStore: Found ${filteredTransactions.length} transactions for account ${accountId}`);
        return filteredTransactions;
      })
    );
  }

  // Méthodes de mise à jour de l'état
  setTransactions(transactions: Transaction[]): void {
    console.log(`TransactionStore: Setting ${transactions.length} transactions`, transactions);
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      transactions
    });
  }

  addTransaction(transaction: Transaction): void {
    console.log(`TransactionStore: Adding transaction`, transaction);
    const currentState = this.state.getValue();
    const updatedTransactions = [...currentState.transactions, transaction];
    this.state.next({
      ...currentState,
      transactions: updatedTransactions
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      error
    });
  }



  // Méthode utilitaire pour obtenir l'état actuel
  getState(): TransactionsState {
    return this.state.getValue();
  }
}
