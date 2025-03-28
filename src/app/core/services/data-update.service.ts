// src/app/core/services/data-update.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service simplifié pour notifier les composants des mises à jour de données
 */
@Injectable({
  providedIn: 'root'
})
export class DataUpdateService {
  // Sujet pour les mises à jour de comptes
  private accountsUpdated = new Subject<void>();
  public accountsUpdated$ = this.accountsUpdated.asObservable();

  // Sujet pour les mises à jour de transactions (avec ID du compte concerné)
  private transactionsUpdated = new Subject<string>();
  public transactionsUpdated$ = this.transactionsUpdated.asObservable();

  /**
   * Notifie que les comptes ont été mis à jour
   */
  notifyAccountsUpdated(): void {
    console.log('DataUpdateService: Notifying accounts updated');
    this.accountsUpdated.next();
  }

  /**
   * Notifie que les transactions d'un compte ont été mises à jour
   */
  notifyTransactionsUpdated(accountId: string): void {
    console.log(`DataUpdateService: Notifying transactions updated for account ${accountId}`);
    this.transactionsUpdated.next(accountId);
  }
}
