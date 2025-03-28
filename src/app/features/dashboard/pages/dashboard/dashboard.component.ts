import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Account } from '../../../../models/account.model';
import { AccountSummaryComponent } from '../../components/account-summary/account-summary.component';
import { DataUpdateService } from '../../../../core/services/data-update.service';
import { AccountStore } from '../../../../store';
import { GetAccountsUseCase, GetAccountDetailsUseCase } from '../../../../usecases';
import { AccountActivityComponent } from '../../../accounts/components/account-activity/account-activity.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    // AccountSummaryComponent,
    AccountActivityComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  isLoading = true;
  error: string | null = null;
  totalBalance = 0;

  private subscriptions = new Subscription();
  private accountStore = inject(AccountStore);
  private getAccountsUseCase = inject(GetAccountsUseCase);
  private getAccountDetailsUseCase = inject(GetAccountDetailsUseCase);
  private dataUpdateService = inject(DataUpdateService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // S'abonner aux sélecteurs du store
    this.subscriptions.add(
      this.accountStore.selectAccounts().subscribe(accounts => {
        console.log('Dashboard: Accounts updated from store', accounts);
        this.accounts = accounts;
        this.calculateTotalBalance();
        this.cdr.detectChanges(); // Forcer la détection des changements
      })
    );

    this.subscriptions.add(
      this.accountStore.selectSelectedAccount().subscribe(account => {
        console.log('Dashboard: Selected account updated from store', account);
        this.selectedAccount = account;
        this.cdr.detectChanges(); // Forcer la détection des changements
      })
    );

    this.subscriptions.add(
      this.accountStore.selectLoading().subscribe(loading => {
        this.isLoading = loading;
      })
    );

    this.subscriptions.add(
      this.accountStore.selectError().subscribe(error => {
        this.error = error;
      })
    );

    // S'abonner aux notifications de mise à jour des comptes
    this.subscriptions.add(
      this.dataUpdateService.accountsUpdated$.subscribe(() => {
        console.log('Dashboard: Account update notification received');
        this.loadAccounts();
      })
    );

    // Charger les données initiales
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadAccounts(): void {
    console.log('Dashboard: Loading accounts');
    this.getAccountsUseCase.execute().subscribe({
      next: () => {
        console.log('Dashboard: Accounts loaded successfully');
        // Si aucun compte n'est sélectionné et qu'il y a des comptes disponibles,
        // sélectionner le premier compte
        const accounts = this.accountStore.getState().accounts;
        if (!this.selectedAccount && accounts.length > 0) {
          this.selectAccount(accounts[0].id);
        } else if (this.selectedAccount) {
          // Rafraîchir les détails du compte sélectionné pour garantir la cohérence
          this.selectAccount(this.selectedAccount.id);
        }
      },
      error: (err) => {
        console.error('Dashboard: Error loading accounts', err);
      }
    });
  }

  selectAccount(accountId: string): void {
    console.log(`Dashboard: Selecting account ${accountId}`);
    this.getAccountDetailsUseCase.execute(accountId).subscribe({
      next: () => {
        console.log(`Dashboard: Account ${accountId} selected successfully`);
      },
      error: (err) => {
        console.error('Dashboard: Error selecting account', err);
      }
    });
  }

  private calculateTotalBalance(): void {
    this.totalBalance = this.accounts.reduce((total, account) => total + account.balance, 0);
    console.log(`Dashboard: Total balance calculated: ${this.totalBalance}`);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  getAccountTypeName(type?: 'CHECKING' | 'SAVINGS' | 'TERM_DEPOSIT'): string {
    switch (type) {
      case 'CHECKING':
        return 'Compte courant';
      case 'SAVINGS':
        return 'Compte épargne';
      case 'TERM_DEPOSIT':
        return 'Dépôt à terme';
      default:
        return 'Compte standard';
    }
  }

  protected readonly Math = Math;
}
