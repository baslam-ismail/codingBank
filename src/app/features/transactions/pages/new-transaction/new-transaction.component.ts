import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountsService } from '../../../../core/services/accounts.service';
import { TransactionsService } from '../../../../core/services/transactions.service';
import { Account } from '../../../../models/account.model';
import { CreateTransactionRequest } from '../../../../models/transaction.model';
import { GetAccountsUseCase } from '../../../../usecases';
import {AccountStore} from '../../../../store';

@Component({
  selector: 'app-new-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './new-transaction.component.html',
  styleUrls: ['./new-transaction.component.scss']
})
export class NewTransactionComponent implements OnInit {
  transactionForm!: FormGroup;
  sourceAccounts: Account[] = [];
  maxAmount = 0;
  isLoading = false;
  isAccountsLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private fb = inject(FormBuilder);
  private accountsService = inject(AccountsService);
  private transactionsService = inject(TransactionsService);
  private router = inject(Router);
  private getAccountsUseCase = inject(GetAccountsUseCase);
  private accountStore = inject(AccountStore);

  ngOnInit(): void {
    this.createForm();
    this.loadAccounts();
  }

  createForm(): void {
    this.transactionForm = this.fb.group({
      emitterAccountId: ['', Validators.required],
      receiverAccountId: ['', Validators.required],
      amount: [0, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(9999999),
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]]
    });

    // Écouter les changements du compte émetteur pour mettre à jour le montant maximal
    this.transactionForm.get('emitterAccountId')?.valueChanges.subscribe(accountId => {
      this.updateMaxAmount(accountId);
    });
  }

  loadAccounts(): void {
    this.isAccountsLoading = true;
    this.accountsService.getAccounts().subscribe({
      next: (accounts) => {
        this.sourceAccounts = accounts;
        this.isAccountsLoading = false;

        // Si des comptes sont disponibles, sélectionner le premier par défaut
        if (accounts.length > 0) {
          this.transactionForm.patchValue({ emitterAccountId: accounts[0].id });
        }
      },
      error: (error) => {
        this.errorMessage = 'Impossible de charger vos comptes. Veuillez réessayer.';
        this.isAccountsLoading = false;
        console.error('Error loading accounts', error);
      }
    });
  }

  updateMaxAmount(accountId: string): void {
    const selectedAccount = this.sourceAccounts.find(account => account.id === accountId);
    if (selectedAccount) {
      this.maxAmount = selectedAccount.balance;

      // Mettre à jour le validateur du montant
      const amountControl = this.transactionForm.get('amount');
      if (amountControl) {
        amountControl.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(this.maxAmount)
        ]);
        amountControl.updateValueAndValidity();
      }
    } else {
      this.maxAmount = 0;
    }
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.markFormGroupTouched(this.transactionForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const transactionData: CreateTransactionRequest = this.transactionForm.value;

    this.transactionsService.createTransaction(transactionData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'La transaction a été effectuée avec succès.';

        // Mettre à jour les soldes de tous les comptes
        this.refreshAllAccountData();

        // Réinitialiser le formulaire
        this.transactionForm.get('amount')?.setValue(0);
        this.transactionForm.get('description')?.setValue('');

        // Rediriger après un délai
        setTimeout(() => {
          this.router.navigate(['/accounts']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Une erreur est survenue lors de la transaction.';
      }
    });
  }

  /**
   * Rafraîchit les données de tous les comptes après une transaction
   */
  refreshAllAccountData(): void {
    // Utiliser le GetAccountsUseCase pour mettre à jour tous les comptes
    this.getAccountsUseCase.execute().subscribe({
      next: (accounts) => {
        console.log('Comptes mis à jour après transaction:', accounts);

        // Vous pouvez également émettre un événement pour informer d'autres composants
        // que les données ont été mises à jour
        this.accountStore.setLoading(false);

      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour des comptes:', error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Getters pour la validation des champs
  get emitterAccountIdInvalid(): boolean {
    const control = this.transactionForm.get('emitterAccountId');
    return !!control && control.invalid && control.touched;
  }

  get receiverAccountIdInvalid(): boolean {
    const control = this.transactionForm.get('receiverAccountId');
    return !!control && control.invalid && control.touched;
  }

  get amountInvalid(): boolean {
    const control = this.transactionForm.get('amount');
    return !!control && control.invalid && control.touched;
  }

  get descriptionInvalid(): boolean {
    const control = this.transactionForm.get('description');
    return !!control && control.invalid && control.touched;
  }

  // Helper pour la gestion des erreurs d'amount
  getAmountErrorMessage(): string {
    const control = this.transactionForm.get('amount');

    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Le montant est requis';
    if (control.errors['min']) return 'Le montant doit être supérieur à 0';
    if (control.errors['max']) return `Le montant ne peut pas dépasser ${this.formatAmount(this.maxAmount)}`;

    return 'Montant invalide';
  }

  // Formattage du montant
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  // Vérifier si les comptes émetteur et récepteur sont identiques
  isSameAccount(): boolean {
    const emitterId = this.transactionForm.get('emitterAccountId')?.value;
    const receiverId = this.transactionForm.get('receiverAccountId')?.value;
    return emitterId && receiverId && emitterId === receiverId;
  }
}
