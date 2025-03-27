// src/app/core/services/accounts.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Account } from '../../models/account.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Récupérer tous les comptes de l'utilisateur
  getAccounts(): Observable<Account[]> {
    // Si en mode démo, retourner directement des données mockées
    if (environment.demo) {
      return of(this.getMockAccounts());
    }

    // Sinon, faire une requête au backend réel
    return this.http.get<any[]>(`${this.apiUrl}/accounts`).pipe(
      map(accounts => accounts.map(account => this.mapApiAccountToModel(account))),
      catchError(error => {
        console.error('Error fetching accounts', error);
        // En cas d'erreur, retourner quand même des données mockées
        return of(this.getMockAccounts());
      })
    );
  }

  // Récupérer un compte spécifique
  getAccountById(id: string): Observable<Account | null> {
    // Si en mode démo, rechercher dans les données mockées
    if (environment.demo) {
      const account = this.getMockAccounts().find(account => account.id === id);
      return of(account || null);
    }

    // Sinon, faire une requête au backend réel
    return this.http.get<any>(`${this.apiUrl}/accounts/${id}`).pipe(
      map(account => this.mapApiAccountToModel(account)),
      catchError(error => {
        console.error(`Error fetching account ${id}`, error);
        // En cas d'erreur, rechercher dans les données mockées
        const mockAccount = this.getMockAccounts().find(account => account.id === id);
        return of(mockAccount || null);
      })
    );
  }

  // Méthode de mappage API vers modèle interne
  private mapApiAccountToModel(apiAccount: any): Account {
    return {
      id: apiAccount.id,
      label: apiAccount.label,
      balance: apiAccount.balance,
      createdAt: apiAccount.openAt || apiAccount.createdAt,
      updatedAt: apiAccount.updatedAt || apiAccount.openAt,
      userId: apiAccount.ownerId,
      accountNumber: apiAccount.id, // Utiliser l'ID comme numéro de compte
      type: apiAccount.type || 'CHECKING',
      currency: apiAccount.currency || 'EUR'
    };
  }

  // Données mockées pour le développement et le mode démo
  private getMockAccounts(): Account[] {
    return [
      {
        id: 'acc-12345678',
        label: 'Compte Courant',
        balance: 1250.75,
        createdAt: new Date(2023, 0, 15).toISOString(),
        updatedAt: new Date(2023, 5, 10).toISOString(),
        userId: 'user-123',
        accountNumber: 'acc-12345678',
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-87654321',
        label: 'Livret A',
        balance: 5680.42,
        createdAt: new Date(2023, 1, 20).toISOString(),
        updatedAt: new Date(2023, 5, 1).toISOString(),
        userId: 'user-123',
        accountNumber: 'acc-87654321',
        type: 'SAVINGS',
        currency: 'EUR'
      },
      {
        id: 'acc-11223344',
        label: 'Plan Épargne Logement',
        balance: 15000,
        createdAt: new Date(2022, 10, 5).toISOString(),
        updatedAt: new Date(2023, 4, 15).toISOString(),
        userId: 'user-123',
        accountNumber: 'acc-11223344',
        type: 'TERM_DEPOSIT',
        currency: 'EUR'
      }
    ];
  }
}
