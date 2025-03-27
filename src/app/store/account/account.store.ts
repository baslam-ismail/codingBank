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
    console.log(`AccountStore: Setting ${accounts.length} accounts`);
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      accounts
    });

    // Si un compte est sélectionné, mettre à jour aussi ses informations
    if (currentState.selectedAccount) {
      const updatedSelectedAccount = accounts.find(a => a.id === currentState.selectedAccount?.id);
      if (updatedSelectedAccount) {
        this.setSelectedAccount(updatedSelectedAccount);
      }
    }
  }

  setSelectedAccount(account: Account | null): void {
    console.log(`AccountStore: Setting selected account`, account);
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      selectedAccount: account
    });
  }

  updateAccount(updatedAccount: Account): void {
    console.log(`AccountStore: Updating account ${updatedAccount.id}`);
    const currentState = this.state.getValue();

    // Mettre à jour le compte dans la liste
    const updatedAccounts = currentState.accounts.map(account =>
      account.id === updatedAccount.id ? updatedAccount : account
    );

    // Mettre à jour également le compte sélectionné si c'est le même
    const updatedSelectedAccount =
      currentState.selectedAccount?.id === updatedAccount.id
        ? updatedAccount
        : currentState.selectedAccount;

    this.state.next({
      ...currentState,
      accounts: updatedAccounts,
      selectedAccount: updatedSelectedAccount
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
