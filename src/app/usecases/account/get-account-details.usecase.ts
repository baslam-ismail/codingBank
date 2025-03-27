import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Account } from '../../models/account.model';
import { AccountsService } from '../../core/services/accounts.service';
import { AccountStore } from '../../store';

@Injectable({
  providedIn: 'root'
})
export class GetAccountDetailsUseCase {
  private accountsService = inject(AccountsService);
  private accountStore = inject(AccountStore);

  execute(accountId: string): Observable<Account | null> {
    this.accountStore.setLoading(true);

    return this.accountsService.getAccountById(accountId).pipe(
      tap({
        next: (account) => {
          if (account) {
            this.accountStore.setSelectedAccount(account);
          }
          this.accountStore.setLoading(false);
          this.accountStore.setError(null);
        },
        error: (error) => {
          this.accountStore.setLoading(false);
          this.accountStore.setError('Impossible de charger les détails du compte');
          console.error('Error fetching account details:', error);
        }
      })
    );
  }
}
