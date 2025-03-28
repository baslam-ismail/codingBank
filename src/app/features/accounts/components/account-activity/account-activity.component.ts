import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Account } from '../../../../models/account.model';
import { Transaction } from '../../../../models/transaction.model';
import { GetTransactionsUseCase } from '../../../../usecases';
import { TransactionStore } from '../../../../store';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-account-activity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account-activity.component.html',
  styleUrls: ['./account-activity.component.scss']
})
export class AccountActivityComponent implements OnInit, OnDestroy {
  @Input() set account(value: Account) {
    console.log('AccountActivity: Account input changed', value);
    this._account = value;
    // Rechargement des données si le compte change
    if (value && value.id) {
      this.loadTransactions();
    }
  }
  get account(): Account {
    return this._account;
  }

  private _account!: Account;

  recentTransactions: Transaction[] = [];
  isLoading = false;
  error: string | null = null;
  showDebugInfo = environment.demo;

  private subscriptions = new Subscription();
  private getTransactionsUseCase = inject(GetTransactionsUseCase);
  private transactionStore = inject(TransactionStore);
  private cdr = inject(ChangeDetectorRef);




  ngOnInit(): void {
    if (this.account && this.account.id) {
      console.log(`AccountActivity: Initializing for account ${this.account.id}`);

      // S'abonner aux transactions depuis le store
      this.subscriptions.add(
        this.transactionStore.selectTransactions().subscribe(transactions => {
          console.log(`AccountActivity: Received ${transactions.length} transactions from store`);
          console.log('All transactions:', JSON.stringify(transactions));

          // Filtrer manuellement ici plutôt que d'utiliser selectTransactionsByAccountId
          const filteredTransactions = transactions.filter(t => {
            // Vérifier si c'est émetteur ou récepteur, en gérant les cas undefined
            const isEmitter = t.emitter?.id === this.account.id || t.emitterAccountId === this.account.id;
            const isReceiver = t.receiver?.id === this.account.id || t.receiverAccountId === this.account.id;

            console.log(`Transaction ${t.id}: isEmitter=${isEmitter}, isReceiver=${isReceiver}`);
            return isEmitter || isReceiver;
          });

          console.log(`AccountActivity: Filtered ${filteredTransactions.length} transactions for account ${this.account.id}`);

          // Trier par date (la plus récente d'abord) et prendre les 5 premières
          this.recentTransactions = filteredTransactions
            .sort((a, b) => {
              const dateA = new Date(a.emittedAt || a.createdAt || '');
              const dateB = new Date(b.emittedAt || b.createdAt || '');
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);

          console.log(`AccountActivity: Showing ${this.recentTransactions.length} recent transactions`);

          // Forcer la détection de changements
          this.cdr.detectChanges();
        })
      );

      // S'abonner à l'état de chargement
      this.subscriptions.add(
        this.transactionStore.selectLoading().subscribe(loading => {
          this.isLoading = loading;
          this.cdr.detectChanges();
        })
      );

      // S'abonner aux erreurs
      this.subscriptions.add(
        this.transactionStore.selectError().subscribe(error => {
          this.error = error;
          this.cdr.detectChanges();
        })
      );

      // Charger les transactions initiales
      this.loadTransactions();
    } else {
      console.warn('AccountActivity: No account ID provided');
    }
  }

  ngOnDestroy(): void {
    console.log('AccountActivity: Component destroyed, unsubscribing');
    this.subscriptions.unsubscribe();
  }

  loadTransactions(): void {
    if (!this.account || !this.account.id) {
      console.error('AccountActivity: Cannot load transactions - no account or account ID provided');
      return;
    }

    console.log(`AccountActivity: Loading transactions for account ${this.account.id}`);
    this.isLoading = true;

    this.getTransactionsUseCase.execute(this.account.id).subscribe({
      next: transactions => {
        console.log(`AccountActivity: Successfully loaded ${transactions.length} transactions`);
        this.isLoading = false;
      },
      error: err => {
        console.error('AccountActivity: Error loading transactions', err);
        this.error = 'Impossible de charger les transactions récentes.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Détermine si une transaction est entrante (crédit) pour ce compte
   */
  isIncoming(transaction: Transaction): boolean {
    // Vérification plus robuste pour supporter différentes structures de données
    const receiverId = transaction.receiver?.id || transaction.receiverAccountId;
    const accountId = this.account.id;
    const result = receiverId === accountId;
    console.log(`Is transaction ${transaction.id} incoming? ${result} (receiverId=${receiverId}, accountId=${accountId})`);
    return result;
  }

  /**
   * Détermine si une transaction est sortante (débit) pour ce compte
   */
  isOutgoing(transaction: Transaction): boolean {
    // Vérification plus robuste pour supporter différentes structures de données
    const emitterId = transaction.emitter?.id || transaction.emitterAccountId;
    const accountId = this.account.id;
    const result = emitterId === accountId;
    console.log(`Is transaction ${transaction.id} outgoing? ${result} (emitterId=${emitterId}, accountId=${accountId})`);
    return result;
  }



  /**
   * Obtient le nom du partenaire de la transaction (émetteur ou destinataire)
   */
  getPartnerName(transaction: Transaction): string {
    if (this.isIncoming(transaction)) {
      // Pour une transaction entrante, le partenaire est l'émetteur
      if (transaction.emitter?.owner?.name) {
        return transaction.emitter.owner.name;
      } else if (transaction.emitter?.id?.startsWith('ext-') || transaction.emitterAccountId?.startsWith('ext-')) {
        return 'Externe';
      } else {
        const id = transaction.emitter?.id || transaction.emitterAccountId || 'inconnu';
        return `Compte ${id.substring(0, 8)}`;
      }
    } else {
      // Pour une transaction sortante, le partenaire est le destinataire
      if (transaction.receiver?.owner?.name) {
        return transaction.receiver.owner.name;
      } else if (transaction.receiver?.id?.startsWith('ext-') || transaction.receiverAccountId?.startsWith('ext-')) {
        return 'Externe';
      } else {
        const id = transaction.receiver?.id || transaction.receiverAccountId || 'inconnu';
        return `Compte ${id.substring(0, 8)}`;
      }
    }
  }

  /**
   * Obtient les initiales du partenaire pour l'avatar
   */
  getPartnerInitials(transaction: Transaction): string {
    const partnerName = this.getPartnerName(transaction);

    if (partnerName === 'Externe') {
      return 'EX';
    }

    if (partnerName.startsWith('Compte')) {
      return 'CB';
    }

    return partnerName
      .split(' ')
      .filter(part => part.length > 0)
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Formate la date selon le format demandé
   */
  formatDate(dateString?: string): string {
    if (!dateString) {
      return 'Date inconnue';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

      // Format: 14/01/2024 14:30
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date', error);
      return 'Date inconnue';
    }
  }

  /**
   * Formate le montant avec le signe approprié
   */
  formatAmount(transaction: Transaction): string {
    const amount = transaction.amount;
    const isNegative = this.isOutgoing(transaction);

    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });

    // Gérer le signe manuellement
    const formattedAmount = formatter.format(Math.abs(amount));
    return isNegative ? `-${formattedAmount}` : `+${formattedAmount}`;
  }

  /**
   * Détermine la classe CSS pour colorer l'affichage selon le type de transaction
   */
  getTransactionClass(transaction: Transaction): string {
    return this.isIncoming(transaction) ? 'transaction-incoming' : 'transaction-outgoing';
  }



  protected readonly Math = Math;
}
