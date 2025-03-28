import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Account } from '../../../../models/account.model';
import { AccountActivityComponent } from '../../components/account-activity/account-activity.component';
import { GetAccountDetailsUseCase } from '../../../../usecases';
import { AccountStore } from '../../../../store';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-account-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AccountActivityComponent,
    CopyButtonComponent
  ],
  templateUrl: './account-details.component.html',
  styles: []
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  account: Account | null = null;
  isLoading = true;
  error: string | null = null;
  showDebugInfo = environment.demo;

  private subscriptions = new Subscription();
  private accountId: string | null = null;

  private route = inject(ActivatedRoute);
  private accountStore = inject(AccountStore);
  private getAccountDetailsUseCase = inject(GetAccountDetailsUseCase);

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
    if (this.accountId) {
      // S'abonner au compte sélectionné dans le store
      this.subscriptions.add(
        this.accountStore.selectSelectedAccount().subscribe(account => {
          console.log('AccountDetails: Selected account updated from store', account);
          this.account = account;
        })
      );

      // S'abonner à l'état de chargement
      this.subscriptions.add(
        this.accountStore.selectLoading().subscribe(loading => {
          this.isLoading = loading;
        })
      );

      // S'abonner aux erreurs
      this.subscriptions.add(
        this.accountStore.selectError().subscribe(error => {
          this.error = error;
        })
      );

      // Charger les détails du compte
      this.loadAccountDetails();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadAccountDetails(): void {
    if (!this.accountId) {
      this.error = 'Identifiant de compte non valide';
      this.isLoading = false;
      return;
    }

    console.log(`AccountDetails: Loading details for account ${this.accountId}`);
    this.getAccountDetailsUseCase.execute(this.accountId).subscribe({
      error: (err) => {
        console.error('AccountDetails: Error loading account details via use case', err);
      }
    });
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
