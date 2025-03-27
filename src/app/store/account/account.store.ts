import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountsState } from '../store.types';
import { Account } from '../../models/account.model';

const initialState: AccountsState = {
  accounts: [],
  selectedAccount: null,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class AccountStore {
  private state = new BehaviorSubject<AccountsState>(initialState);

  // Sélecteurs
  get state$(): Observable<AccountsState> {
    return this.state.asObservable();
  }

  selectAccounts(): Observable<Account[]> {
    return this.state$.pipe(map(state => state.accounts));
  }

  selectSelectedAccount(): Observable<Account | null> {
    return this.state$.pipe(map(state => state.selectedAccount));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(state => state.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(state => state.error));
  }

  selectTotalBalance(): Observable<number> {
    return this.selectAccounts().pipe(
      map(accounts => accounts.reduce((total, account) => total + account.balance, 0))
    );
  }


  setAccounts(accounts: Account[]): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      accounts
    });
  }

  setSelectedAccount(account: Account | null): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      selectedAccount: account
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

  getState(): AccountsState {
    return this.state.getValue();
  }
}
