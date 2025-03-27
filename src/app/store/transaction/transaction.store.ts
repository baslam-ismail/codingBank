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

  selectTransactions(): Observable<Transaction[]> {
    return this.state$.pipe(map(state => state.transactions));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(state => state.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(state => state.error));
  }

  selectTransactionsByAccountId(accountId: string): Observable<Transaction[]> {
    return this.selectTransactions().pipe(
      map(transactions => transactions.filter(
        t => t.emitterAccountId === accountId || t.receiverAccountId === accountId
      ))
    );
  }


  setTransactions(transactions: Transaction[]): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      transactions
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

  resetState(): void {
    this.state.next(initialState);
  }
}
