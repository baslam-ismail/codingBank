import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccountsService } from '../../../../core/services/accounts.service';
import { TransactionsService } from '../../../../core/services/transactions.service';
import { Account } from '../../../../models/account.model';
import { Transaction } from '../../../../models/transaction.model';

@Component({
  selector: 'app-account-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account-details.component.html',
  styles: []
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  account: Account | null = null;
  recentTransactions: Transaction[] = [];
  isLoading = true;
  isTransactionsLoading = false;
  error: string | null = null;

  private subscriptions = new Subscription();

  private route = inject(ActivatedRoute);
  private accountsService = inject(AccountsService);
  private transactionsService = inject(TransactionsService);

  ngOnInit(): void {
    this.loadAccountDetails();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadAccountDetails(): void {
    const accountId = this.route.snapshot.paramMap.get('id');
    if (!accountId) {
      this.error = 'Identifiant de compte non valide';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.accountsService.getAccountById(accountId).subscribe({
      next: (account) => {
        this.account = account;
        this.isLoading = false;

        // Charger les transactions après le chargement du compte
        this.loadRecentTransactions(accountId);
      },
      error: (err) => {
        this.error = 'Impossible de charger les détails du compte';
        this.isLoading = false;
        console.error('Error loading account details', err);
      }
    });
  }

  loadRecentTransactions(accountId: string): void {
    this.isTransactionsLoading = true;

    this.transactionsService.getTransactionsByAccountId(accountId).subscribe({
      next: (transactions) => {
        // Prendre les 5 transactions les plus récentes
        this.recentTransactions = transactions
          .sort((a, b) => {
            const dateA = new Date(b.emittedAt || b.createdAt || '');
            const dateB = new Date(a.emittedAt || a.createdAt || '');
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);
        this.isTransactionsLoading = false;
        console.log('Transactions récentes chargées:', this.recentTransactions);
      },
      error: (err) => {
        console.error('Error loading recent transactions', err);
        this.isTransactionsLoading = false;
      }
    });
  }

  /**
   * Détermine si une transaction est entrante (crédit) pour ce compte
   */
  isIncoming(transaction: any): boolean {
    // Récupérer l'ID du compte actuel
    const currentAccountId = this.account?.id;

    // Vérifier la structure appropriée - adaptée aux deux formats possibles
    let receiverId;

    // Format 1: transaction.receiver.id (structure imbriquée)
    if (transaction.receiver && transaction.receiver.id) {
      receiverId = transaction.receiver.id;
    }
    // Format 2: transaction.receiverAccountId (structure plate)
    else if (transaction.receiverAccountId) {
      receiverId = transaction.receiverAccountId;
    }

    console.log('TRANSACTION CHECK - CURRENT ACCOUNT:', currentAccountId);
    console.log('TRANSACTION CHECK - RECEIVER:', receiverId);

    // Une transaction est entrante si ce compte est le destinataire
    const isIncomingTx = receiverId === currentAccountId;
    console.log('IS INCOMING:', isIncomingTx);

    return isIncomingTx;
  }

  /**
   * Détermine si une transaction est sortante (débit) pour ce compte
   */
  isOutgoing(transaction: any): boolean {
    // Récupérer l'ID du compte actuel
    const currentAccountId = this.account?.id;

    // Vérifier la structure appropriée - adaptée aux deux formats possibles
    let emitterId;

    // Format 1: transaction.emitter.id (structure imbriquée)
    if (transaction.emitter && transaction.emitter.id) {
      emitterId = transaction.emitter.id;
    }
    // Format 2: transaction.emitterAccountId (structure plate)
    else if (transaction.emitterAccountId) {
      emitterId = transaction.emitterAccountId;
    }

    // Une transaction est sortante si ce compte est l'émetteur
    const isOutgoingTx = emitterId === currentAccountId;
    console.log('IS OUTGOING:', isOutgoingTx);

    return isOutgoingTx;
  }

  /**
   * Calcule le montant avec le signe approprié
   */
  getTransactionAmount(transaction: any): number {
    return this.isIncoming(transaction)
      ? Math.abs(transaction.amount)
      : -Math.abs(transaction.amount);
  }

  formatAmount(amount: number, showSign: boolean = false): string {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      signDisplay: showSign ? 'always' : 'auto'
    });

    return formatter.format(amount);
  }

  isValidDate(dateString: string | undefined): boolean {
    if (!dateString) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getFullYear() > 2000;
  }

  formatDate(dateString?: string): string {
    if (!dateString || !this.isValidDate(dateString)) {
      return 'Date non disponible';
    }

    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date', error);
      return 'Date non disponible';
    }
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
