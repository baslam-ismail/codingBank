// src/app/core/services/data-update.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service pour gérer les mises à jour de données entre composants
 */
@Injectable({
  providedIn: 'root'
})
export class DataUpdateService {
  // Sujet pour les mises à jour de comptes
  private accountsUpdated = new Subject<void>();

  // Sujet pour les mises à jour de transactions
  private transactionsUpdated = new Subject<string>();

  // Observable auquel les composants peuvent s'abonner pour être notifiés
  // des mises à jour de comptes
  public accountsUpdated$ = this.accountsUpdated.asObservable();

  // Observable pour les mises à jour de transactions avec l'ID du compte concerné
  public transactionsUpdated$ = this.transactionsUpdated.asObservable();

  /**
   * Notifie tous les composants qu'il faut rafraîchir les données des comptes
   */
  notifyAccountsUpdated(): void {
    this.accountsUpdated.next();
  }

  /**
   * Notifie que les transactions d'un compte spécifique ont été mises à jour
   * @param accountId ID du compte concerné
   */
  notifyTransactionsUpdated(accountId: string): void {
    this.transactionsUpdated.next(accountId);
  }
}
