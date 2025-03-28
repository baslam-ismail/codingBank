import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Transaction } from '../../../../models/transaction.model';
import { GetTransactionDetailsUseCase } from '../../../../usecases/transaction/get-transaction-details.usecase';
import { TransactionStore } from '../../../../store';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent implements OnInit, OnDestroy {
  transaction: Transaction | null = null;
  isLoading = true;
  error: string | null = null;
  currentAccountId: string | null = null;

  private subscriptions = new Subscription();
  private transactionId: string | null = null;

  private route = inject(ActivatedRoute);
  private transactionStore = inject(TransactionStore);
  private getTransactionDetailsUseCase = inject(GetTransactionDetailsUseCase);

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id');
    if (this.transactionId) {
      // S'abonner à l'état de chargement
      this.subscriptions.add(
        this.transactionStore.selectLoading().subscribe(loading => {
          this.isLoading = loading;
        })
      );

      // S'abonner aux erreurs
      this.subscriptions.add(
        this.transactionStore.selectError().subscribe(error => {
          this.error = error;
        })
      );

      // Charger les détails de la transaction
      this.loadTransactionDetails();
    } else {
      this.error = 'Identifiant de transaction non valide';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadTransactionDetails(): void {
    if (!this.transactionId) {
      this.error = 'Identifiant de transaction non valide';
      this.isLoading = false;
      return;
    }

    console.log(`TransactionDetails: Loading details for transaction ${this.transactionId}`);
    this.getTransactionDetailsUseCase.execute(this.transactionId).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        console.log('TransactionDetails: Transaction loaded', transaction);
      },
      error: (err) => {
        console.error('TransactionDetails: Error loading transaction details', err);
        this.error = err.message || 'Impossible de charger les détails de la transaction';
      }
    });
  }

  formatAmount(): string {
    if (!this.transaction) return '';
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
    const amount = formatter.format(Math.abs(this.transaction.amount));
    return this.isIncoming() ? `+${amount}` : `-${amount}`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Date inconnue';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

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

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Terminée';
      case 'PENDING':
        return 'En attente';
      case 'FAILED':
        return 'Échouée';
      default:
        return 'Complétée';
    }
  }

  isIncoming(): boolean {
    if (!this.transaction || !this.currentAccountId) return false;
    return this.transaction.receiverAccountId === this.currentAccountId;
  }

  getEmitterName(): string {
    if (!this.transaction) return 'Inconnu';
    if (this.transaction.emitter?.owner?.name) {
      return this.transaction.emitter.owner.name;
    }
    if (this.transaction.emitterAccountId?.startsWith('ext-')) {
      return 'Compte externe';
    }
    return `Compte ${this.transaction.emitterAccountId?.substring(0, 8) || 'inconnu'}`;
  }

  getReceiverName(): string {
    if (!this.transaction) return 'Inconnu';
    if (this.transaction.receiver?.owner?.name) {
      return this.transaction.receiver.owner.name;
    }
    if (this.transaction.receiverAccountId?.startsWith('ext-')) {
      return 'Compte externe';
    }
    return `Compte ${this.transaction.receiverAccountId?.substring(0, 8) || 'inconnu'}`;
  }

  getEmitterInitials(): string {
    const name = this.getEmitterName();
    return this.getInitials(name);
  }

  getReceiverInitials(): string {
    const name = this.getReceiverName();
    return this.getInitials(name);
  }

  private getInitials(name: string): string {
    if (name === 'Compte externe' || name.startsWith('Compte ')) {
      return name.substring(0, 2).toUpperCase();
    }

    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }
}
