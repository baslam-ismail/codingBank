import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { User } from '../models/user.model';


export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AccountsState {
  accounts: Account[];
  selectedAccount: Account | null;
  loading: boolean;
  error: string | null;
}

export interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}
