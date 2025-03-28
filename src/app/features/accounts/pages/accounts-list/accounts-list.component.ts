import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountsService } from '../../../../core/services/accounts.service';
import { Account } from '../../../../models/account.model';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accounts-list.component.html',
  styles: []
})
export class AccountsListComponent implements OnInit {
  accounts: Account[] = [];
  isLoading = true;
  error: string | null = null;

  private accountsService = inject(AccountsService);

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountsService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger vos comptes. Veuillez réessayer plus tard.';
        this.isLoading = false;
        console.error('Error loading accounts', err);
      }
    });
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
        return 'Compte';
    }
  }
}
