// src/app/features/dashboard/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Account } from '../../../../models/account.model';
import { AccountSummaryComponent } from '../../components/account-summary/account-summary.component';
import { DataUpdateService } from '../../../../core/services/data-update.service';
import { AccountStore } from '../../../../store';
import { GetAccountsUseCase, GetAccountDetailsUseCase } from '../../../../usecases';
// import {AccountActivityComponent} from '../../../accounts/components/account-activity/account-activity.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    // AccountActivityComponent,
    // AccountSummaryComponent
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

  ngOnInit(): void {
    // S'abonner aux sélecteurs du store
    this.subscriptions.add(
      this.accountStore.selectAccounts().subscribe(accounts => {
        this.accounts = accounts;
        this.calculateTotalBalance();
      })
    );

    this.subscriptions.add(
      this.accountStore.selectSelectedAccount().subscribe(account => {
        this.selectedAccount = account;
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
        console.log('Notification reçue: rafraîchissement des comptes');
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
    this.getAccountsUseCase.execute().subscribe({
      next: () => {
        console.log('Comptes chargés avec succès');
        // Si aucun compte n'est sélectionné et qu'il y a des comptes disponibles,
        // sélectionner le premier compte
        const accounts = this.accountStore.getState().accounts;
        if (!this.selectedAccount && accounts.length > 0) {
          this.selectAccount(accounts[0].id);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des comptes', err);
      }
    });
  }

  selectAccount(accountId: string): void {
    this.getAccountDetailsUseCase.execute(accountId).subscribe({
      next: () => {
        console.log('Compte sélectionné:', accountId);
      },
      error: (err) => {
        console.error('Erreur lors de la sélection du compte', err);
      }
    });
  }

  private calculateTotalBalance(): void {
    this.totalBalance = this.accounts.reduce((total, account) => total + account.balance, 0);
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
