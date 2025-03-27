// src/app/features/transactions/pages/transaction-history/transaction-history.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransactionsService } from '../../../../core/services/transactions.service';
import { AccountsService } from '../../../../core/services/accounts.service';
import { Transaction } from '../../../../models/transaction.model';
import { Account } from '../../../../models/account.model';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transaction-history.component.html',
  styles: []
})
export class TransactionHistoryComponent implements OnInit {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  selectedAccountId: string | null = null;

  isLoading = true;
  errorMessage: string | null = null;

  private accountsService = inject(AccountsService);
  private transactionsService = inject(TransactionsService);

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountsService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.isLoading = false;

        // Sélectionner automatiquement le premier compte
        if (accounts.length > 0) {
          this.selectedAccountId = accounts[0].id;
          this.loadTransactions(this.selectedAccountId);
        }
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

    this.transactionsService.getTransactionsByAccountId(accountId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Impossible de charger l\'historique des transactions.';
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


  // getTransactionPartnerName(transaction: Transaction): string {
  //   const partnerId = this.isIncoming(transaction)
  //     ? transaction.emitterAccountId
  //     : transaction.receiverAccountId;
  //
  //   if (!partnerId) {
  //     return 'Compte inconnu';
  //   }
  //
  //   const partnerAccount = this.accounts.find(account => account.id === partnerId);
  //
  //   return partnerAccount
  //     ? `${partnerAccount.label}`
  //     : `Compte ${partnerId.substring(0, 8)}...`;
  // }


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

  /**
   * Détermine si une transaction est une entrée d'argent
   */
  isMoneyReceived(transaction: Transaction): boolean {
    // Dans l'historique des transactions, on considère qu'une transaction est entrante
    // si le compte sélectionné est le destinataire
    return transaction.receiverAccountId === this.selectedAccountId;
  }



  isIncoming(transaction: any): boolean {
    // Récupérer l'ID du compte sélectionné
    const currentAccountId = this.selectedAccountId;

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

    // Une transaction est entrante si ce compte est le destinataire
    return receiverId === currentAccountId;
  }

  /**
   * Détermine si une transaction est sortante avec la structure imbriquée
   */
  isOutgoing(transaction: any): boolean {
    // Récupérer l'ID du compte sélectionné
    const currentAccountId = this.selectedAccountId;

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
    return emitterId === currentAccountId;
  }

  /**
   * Obtient le nom du partenaire de transaction adapté à la structure imbriquée
   */
  getTransactionPartnerName(transaction: any): string {
    // Si c'est une transaction entrante, le partenaire est l'émetteur
    if (this.isIncoming(transaction)) {
      // Format 1: structure imbriquée
      if (transaction.emitter && transaction.emitter.owner) {
        return transaction.emitter.owner.name || `Compte ${transaction.emitter.id?.substring(0, 8)}...`;
      }
      // Format 2: structure plate
      else if (transaction.emitterAccountId) {
        const partnerAccount = this.accounts.find(account => account.id === transaction.emitterAccountId);
        return partnerAccount?.label || `Compte ${transaction.emitterAccountId?.substring(0, 8)}...`;
      }
    }
    // Si c'est une transaction sortante, le partenaire est le destinataire
    else {
      // Format 1: structure imbriquée
      if (transaction.receiver && transaction.receiver.owner) {
        return transaction.receiver.owner.name || `Compte ${transaction.receiver.id?.substring(0, 8)}...`;
      }
      // Format 2: structure plate
      else if (transaction.receiverAccountId) {
        const partnerAccount = this.accounts.find(account => account.id === transaction.receiverAccountId);
        return partnerAccount?.label || `Compte ${transaction.receiverAccountId?.substring(0, 8)}...`;
      }
    }

    return 'Compte inconnu';
  }

  /**
   * Formate un montant avec le signe approprié
   */
  formatAmount(amount: number, showSign: boolean = false): string {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      signDisplay: showSign ? 'always' : 'auto'
    });

    return formatter.format(amount);
  }

// Ajoutez cette propriété pour utiliser Math dans le template
  protected readonly Math = Math;
}
