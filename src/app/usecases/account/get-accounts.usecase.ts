import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Account } from '../../models/account.model';
import { AccountsService } from '../../core/services/accounts.service';
import { AccountStore } from '../../store';

@Injectable({
  providedIn: 'root'
})
export class GetAccountsUseCase {
  private accountsService = inject(AccountsService);
  private accountStore = inject(AccountStore);

  execute(): Observable<Account[]> {
    // Indiquer que le chargement est en cours
    this.accountStore.setLoading(true);

    return this.accountsService.getAccounts().pipe(
      tap({
        next: (accounts) => {
          // Mettre à jour le store avec les comptes chargés
          this.accountStore.setAccounts(accounts);
          this.accountStore.setLoading(false);
          this.accountStore.setError(null);
        },
        error: (error) => {
          // Gérer l'erreur
          this.accountStore.setLoading(false);
          this.accountStore.setError('Impossible de charger les comptes');
          console.error('Error fetching accounts:', error);
        }
      })
    );
  }
}
