import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account } from '../../../../models/account.model';

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-summary.component.html',
  styles: [`
    :host {
      display: block;
      cursor: pointer;
    }
  `]
})
export class AccountSummaryComponent {
  @Input() account!: Account;

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
        return 'Compte';
    }
  }
}
