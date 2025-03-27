// src/app/core/services/accounts.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { Account } from '../../models/account.model';
import { environment } from '../../../environments/environment';
import { DemoDataService } from './demo-data.service';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private demoDataService = inject(DemoDataService);

  // Récupérer tous les comptes de l'utilisateur
  getAccounts(): Observable<Account[]> {
    // Si en mode démo, retourner directement les données mockées
    if (environment.demo) {
      console.log('Using demo accounts data');
      return this.demoDataService.getAccounts().pipe(
        tap(accounts => console.log('Demo accounts:', accounts)),
        delay(800) // Simuler un délai réseau
      );
    }

    // Sinon, faire une requête au backend réel
    return this.http.get<any[]>(`${this.apiUrl}/accounts`).pipe(
      map(accounts => accounts.map(account => this.mapApiAccountToModel(account))),
      catchError(error => {
        console.error('Error fetching accounts', error);
        // En cas d'erreur, retourner des données mockées
        return this.demoDataService.getAccounts();
      })
    );
  }

  // Récupérer un compte spécifique
  getAccountById(id: string): Observable<Account | null> {
    // Si en mode démo, rechercher dans les données mockées
    if (environment.demo) {
      const account = this.demoDataService.getAccountById(id);
      return of(account).pipe(
        tap(account => console.log('Demo account by ID:', account)),
        delay(600) // Simuler un délai réseau
      );
    }

    // Sinon, faire une requête au backend réel
    return this.http.get<any>(`${this.apiUrl}/accounts/${id}`).pipe(
      map(account => this.mapApiAccountToModel(account)),
      catchError(error => {
        console.error(`Error fetching account ${id}`, error);
        // En cas d'erreur, rechercher dans les données mockées
        return of(this.demoDataService.getAccountById(id));
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
      accountNumber: apiAccount.accountNumber || apiAccount.id,
      type: apiAccount.type || 'CHECKING',
      currency: apiAccount.currency || 'EUR'
    };
  }
}
