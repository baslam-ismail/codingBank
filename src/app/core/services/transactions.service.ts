// src/app/core/services/transactions.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import {
  Transaction,
  CreateTransactionRequest,
  TransactionResponse
} from '../../models/transaction.model';
import { environment } from '../../../environments/environment';
import { DemoDataService } from './demo-data.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private demoDataService = inject(DemoDataService);

  getTransactionsByAccountId(accountId: string): Observable<Transaction[]> {
    // Si en mode démo, retourner directement des données mockées
    if (environment.demo) {
      console.log(`TransactionsService: Getting transactions for account ${accountId} in demo mode`);

      // Récupérer les transactions existantes sans créer de transaction test
      const transactions = this.demoDataService.getTransactionsByAccountId(accountId);
      console.log('TransactionsService: Demo transactions:', transactions);

      return of(transactions).pipe(
        delay(300) // Simuler un délai réseau
      );
    }

    // Sinon, faire une requête au backend réel
    return this.http.get<Transaction[]>(`${this.apiUrl}/accounts/${accountId}/transactions`).pipe(
      catchError(error => {
        console.error('TransactionsService: Error fetching transactions', error);
        // En cas d'erreur, retourner des données mockées
        return of(this.demoDataService.getTransactionsByAccountId(accountId));
      })
    );
  }

  createTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    // Si en mode démo, simuler une transaction réussie
    if (environment.demo) {
      console.log('TransactionsService: Creating transaction in demo mode:', transaction);

      // Vérifier si les comptes existent
      const emitterAccount = this.demoDataService.getAccountById(transaction.emitterAccountId);

      if (!emitterAccount) {
        console.error(`TransactionsService: Emitter account ${transaction.emitterAccountId} not found`);
        return throwError(() => new Error('Compte émetteur introuvable.'));
      }

      if (transaction.amount <= 0) {
        console.error('TransactionsService: Transaction amount must be positive');
        return throwError(() => new Error('Le montant doit être supérieur à 0.'));
      }

      if (emitterAccount.balance < transaction.amount) {
        console.error(`TransactionsService: Insufficient balance (${emitterAccount.balance}) for transaction amount (${transaction.amount})`);
        return throwError(() => new Error('Solde insuffisant pour effectuer cette transaction.'));
      }

      // Créer la transaction avec le format exact attendu
      const newTransaction: Transaction = {
        id: 'tx-' + Math.random().toString(36).substring(2, 15),
        amount: transaction.amount,
        description: transaction.description,
        emitterAccountId: transaction.emitterAccountId,
        receiverAccountId: transaction.receiverAccountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Ajouter la transaction à nos données de démo
      this.demoDataService.addTransaction(newTransaction);
      console.log('TransactionsService: Transaction added to demo data:', newTransaction);

      // Retourner la réponse
      return of(newTransaction).pipe(
        delay(300), // Simuler un délai réseau
        tap(() => console.log('TransactionsService: Demo transaction created successfully'))
      );
    }


    // Sinon, envoyer la transaction au backend réel
    return this.http.post<TransactionResponse>(`${this.apiUrl}/transactions/emit`, transaction).pipe(
      catchError(error => {
        console.error('TransactionsService: Error creating transaction', error);

        if (error.status === 400 && error.error?.message?.includes('insufficient funds')) {
          return throwError(() => new Error('Solde insuffisant pour effectuer cette transaction.'));
        }

        if (error.status === 403) {
          return throwError(() => new Error('Accès refusé. Veuillez vérifier vos droits ou votre connexion.'));
        }

        return throwError(() => new Error('Impossible de réaliser la transaction. Veuillez réessayer plus tard.'));
      })
    );
  }
}
