import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionsState } from '../store.types';
import { Transaction, DisplayTransaction } from '../../models/transaction.model';

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

  // Sélecteurs de base
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

  /**
   * Normalise une transaction pour garantir une cohérence d'affichage dans toute l'application
   * @param transaction La transaction à normaliser
   * @returns Transaction normalisée avec direction déterminée
   */
  normalizeTransaction(transaction: Transaction): DisplayTransaction {
    const normalized: DisplayTransaction = {
      ...transaction,
      direction: 'incoming',
      displayAmount: 0,
      displaySign: '+',
      formattedAmount: ''
    };


    const hasRecuPrefix = transaction.description?.includes('Reçu de') ?? false;
    const hasEnvoyePrefix = transaction.description?.includes('Envoyé à') ?? false;
    const amount = transaction.amount || 0;

    if (hasRecuPrefix) {

      normalized.direction = 'incoming';
      normalized.displayAmount = Math.abs(amount);
      normalized.displaySign = '+';
    }
    else if (hasEnvoyePrefix) {

      normalized.direction = 'outgoing';

      normalized.displayAmount = Math.abs(amount);
      normalized.displaySign = '-';
    }
    else {

      if (amount >= 0) {
        normalized.direction = 'incoming';
        normalized.displayAmount = amount;
        normalized.displaySign = '+';
      } else {
        normalized.direction = 'outgoing';
        normalized.displayAmount = Math.abs(amount);
        normalized.displaySign = '-';
      }
    }

    normalized.formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(normalized.displayAmount);

    return normalized;
  }

  /**
   * Retourne toutes les transactions normalisées pour assurer cohérence d'affichage
   */
  selectAllNormalizedTransactions(): Observable<DisplayTransaction[]> {
    return this.selectTransactions().pipe(
      map(transactions => {
        console.log(`TransactionStore: Normalizing ${transactions.length} transactions`);

        const normalizedTransactions = transactions.map(tx => this.normalizeTransaction(tx));

        return normalizedTransactions.sort((a, b) => {
          const dateA = new Date(a.emittedAt || a.createdAt || '');
          const dateB = new Date(b.emittedAt || b.createdAt || '');
          return dateB.getTime() - dateA.getTime();
        });
      })
    );
  }


  setTransactions(transactions: Transaction[]): void {
    console.log(`TransactionStore: Setting ${transactions.length} transactions`);
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      transactions
    });
  }

  addTransaction(transaction: Transaction): void {
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

  resetState(): void {
    this.state.next(initialState);
  }

  getState(): TransactionsState {
    return this.state.getValue();
  }
}
