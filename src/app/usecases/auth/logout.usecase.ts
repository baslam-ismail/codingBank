import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../core/authentication/auth.service';
import { AuthStore } from '../../store';
import { AccountStore } from '../../store';
import { TransactionStore } from '../../store';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LogoutUseCase {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private accountStore = inject(AccountStore);
  private transactionStore = inject(TransactionStore);
  private router = inject(Router);

  execute(): void {
    // Le service de auth s'occupe de supprimer le token du localStorage
    this.authService.logout();

    // Réinitialiser tous les états dans le store
    this.authStore.resetState();
    this.accountStore.resetState();
    this.transactionStore.resetState();

    // Rediriger vers la page de connexion
    this.router.navigate(['/auth/login']);
  }
}
