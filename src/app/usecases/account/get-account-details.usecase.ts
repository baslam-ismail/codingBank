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
    console.log(`GetAccountDetailsUseCase: Fetching details for account ${accountId}`);

    return this.accountsService.getAccountById(accountId).pipe(
      tap({
        next: (account) => {
          console.log(`GetAccountDetailsUseCase: Received account details:`, account);
          if (account) {
            // Mettre à jour le compte sélectionné
            this.accountStore.setSelectedAccount(account);

            // Important: Mettre également à jour ce compte dans la liste des comptes
            // pour assurer la cohérence des soldes
            this.updateAccountInList(account);
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

  // Cette méthode assure que le compte est également mis à jour dans la liste des comptes
  private updateAccountInList(updatedAccount: Account): void {
    // Récupérer la liste actuelle des comptes
    const currentAccounts = this.accountStore.getState().accounts;

    // Remplacer le compte mis à jour dans la liste
    const updatedAccounts = currentAccounts.map(account =>
      account.id === updatedAccount.id ? updatedAccount : account
    );

    // Mettre à jour la liste des comptes dans le store
    this.accountStore.setAccounts(updatedAccounts);
    console.log(`GetAccountDetailsUseCase: Updated account in accounts list`, updatedAccounts);
  }
}
