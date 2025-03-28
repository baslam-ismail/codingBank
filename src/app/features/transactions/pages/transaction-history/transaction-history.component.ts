import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Transaction } from '../../../../models/transaction.model';
import { Account } from '../../../../models/account.model';
import { GetTransactionsUseCase, GetAccountsUseCase } from '../../../../usecases';
import { AccountStore, TransactionStore } from '../../../../store';
import { DataUpdateService } from '../../../../core/services/data-update.service';
import { environment } from '../../../../../environments/environment';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CopyButtonComponent
  ],
  templateUrl: './transaction-history.component.html',
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  selectedAccountId: string | null = null;

  isLoading = true;
  errorMessage: string | null = null;
  showDebugInfo = environment.demo; // Afficher les infos de débogage en mode démo

  private subscriptions = new Subscription();
  private getTransactionsUseCase = inject(GetTransactionsUseCase);
  private getAccountsUseCase = inject(GetAccountsUseCase);
  private accountStore = inject(AccountStore);
  private transactionStore = inject(TransactionStore);
  private dataUpdateService = inject(DataUpdateService);

  ngOnInit(): void {
    this.loadAccounts();

    // S'abonner aux mises à jour des transactions
    this.subscriptions.add(
      this.dataUpdateService.transactionsUpdated$.subscribe(accountId => {
        if (accountId === this.selectedAccountId) {
          this.loadTransactions(accountId);
        }
      })
    );

    // S'abonner aux mises à jour des comptes
    this.subscriptions.add(
      this.dataUpdateService.accountsUpdated$.subscribe(() => {
        this.loadAccounts();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadAccounts(): void {
    this.isLoading = true;

    this.getAccountsUseCase.execute().subscribe({
      next: () => {
        this.accountStore.selectAccounts().subscribe(accounts => {
          this.accounts = accounts;
          this.isLoading = false;

          // Sélectionner automatiquement le premier compte
          if (accounts.length > 0 && !this.selectedAccountId) {
            this.selectedAccountId = accounts[0].id;
            this.loadTransactions(this.selectedAccountId);
          }
        });
      },
      error: (error) => {
        this.errorMessage = 'Impossible de charger vos comptes.';
        this.isLoading = false;
        console.error('Error loading accounts', error);
      }
    });
  }

  loadTransactions(accountId: string): void {
    this.isLoading = true;
    this.transactions = [];

    this.getTransactionsUseCase.executeForAccount(accountId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;

        console.log('Transactions loaded for account', accountId, ':', transactions);
      },
      error: (error) => {
        this.errorMessage = "Impossible de charger l\'historique des transactions.";
        this.isLoading = false;
        console.error('Error loading transactions', error);
      }
    });
  }

  onAccountSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const accountId = selectElement.value;

    this.selectedAccountId = accountId;
    this.loadTransactions(accountId);
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return 'Date inconnue';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }

    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTransactionPartnerName(transaction: Transaction): string {
    // Entrante = le partenaire est l'émetteur
    if (transaction.receiverAccountId === this.selectedAccountId) {
      if (transaction.emitterAccountId?.startsWith('ext-')) {
        return `Externe (${transaction.emitterAccountId})`;
      }

      const partnerAccount = this.accounts.find(account => account.id === transaction.emitterAccountId);
      return partnerAccount
        ? partnerAccount.label
        : `Compte ${transaction.emitterAccountId?.substring(0, 8) || 'inconnu'}...`;
    }

    // Sortante = le partenaire est le destinataire
    if (transaction.receiverAccountId?.startsWith('ext-')) {
      return `Externe (${transaction.receiverAccountId})`;
    }

    const partnerAccount = this.accounts.find(account => account.id === transaction.receiverAccountId);
    return partnerAccount
      ? partnerAccount.label
      : `Compte ${transaction.receiverAccountId?.substring(0, 8) || 'inconnu'}...`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  // Vérifier si c'est une transaction entrante
  isIncoming(transaction: Transaction): boolean {
    return transaction.receiverAccountId === this.selectedAccountId;
  }

  protected readonly Math = Math;
}
