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
import { DataUpdateService } from './data-update.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private demoDataService = inject(DemoDataService);
  private dataUpdateService = inject(DataUpdateService);

  /**
   * Obtenir les transactions d'un compte
   */
  getTransactionsByAccountId(accountId: string): Observable<Transaction[]> {
    console.log(`TransactionsService: Getting transactions for account ${accountId}`);

    // En mode démo
    if (environment.demo) {
      console.log(`TransactionsService: Using demo mode for account ${accountId}`);
      const transactions = this.demoDataService.getTransactionsByAccountId(accountId);
      return of(transactions).pipe(
        delay(300), // Simuler un délai réseau
        tap(() => console.log(`TransactionsService: Returned ${transactions.length} demo transactions`))
      );
    }

    // En mode API réelle
    return this.http.get<Transaction[]>(`${this.apiUrl}/accounts/${accountId}/transactions`).pipe(
      tap(transactions => console.log(`TransactionsService: API returned ${transactions.length} transactions`)),
      catchError(error => {
        console.error('TransactionsService: API error fetching transactions', error);
        return of([]);
      })
    );
  }

  /**
   * Créer une nouvelle transaction
   */
  createTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    console.log('TransactionsService: Création d\'une transaction:', {
      de: transaction.emitterAccountId,
      vers: transaction.receiverAccountId,
      montant: transaction.amount,
      description: transaction.description
    });

    // En mode démo
    if (environment.demo) {
      return this.createDemoTransaction(transaction);
    }

    // En mode API réelle
    return this.createRealTransaction(transaction);
  }

  /**
   * Implémentation du mode démo pour créer une transaction
   */
  private createDemoTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    console.log('TransactionsService: Création d\'une transaction en mode démo');

    try {
      // 1. Validation des données - cette étape peut lancer des erreurs
      console.log('TransactionsService: Validation des données de transaction');
      this.validateTransaction(transaction);
      console.log('TransactionsService: Validation réussie, ID destinataire résolu:', transaction.receiverAccountId);

      // 2. Création de l'objet transaction
      const newTransaction: Transaction = {
        id: 'tx-' + Date.now(),
        amount: Math.round(transaction.amount * 100) / 100,
        description: transaction.description,
        emitterAccountId: transaction.emitterAccountId,
        receiverAccountId: transaction.receiverAccountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. IMPORTANT: Mettre à jour les soldes AVANT d'ajouter la transaction
      console.log('TransactionsService: Mise à jour des soldes pour la transaction');
      this.demoDataService.updateAccountBalances(newTransaction);

      // 4. Ajouter la transaction à l'historique
      console.log('TransactionsService: Ajout de la transaction à l\'historique');
      this.demoDataService.addTransaction(newTransaction);

      // 5. Notifier le système des mises à jour
      console.log('TransactionsService: Envoi des notifications de mise à jour');
      this.dataUpdateService.notifyAccountsUpdated();
      this.dataUpdateService.notifyTransactionsUpdated(transaction.emitterAccountId);
      if (!transaction.receiverAccountId.startsWith('ext-')) {
        this.dataUpdateService.notifyTransactionsUpdated(transaction.receiverAccountId);
      }

      console.log('TransactionsService: Transaction créée avec succès:', newTransaction);

      // 6. Retourner le résultat
      return of(newTransaction).pipe(
        delay(300) // Simuler un délai réseau
      );

    } catch (error: any) {
      console.error('TransactionsService: Erreur dans la transaction démo:', error);
      return throwError(() => new Error(error.message || 'Erreur lors de la création de la transaction'));
    }
  }

  /**
   * Valider les données de transaction et résoudre les identifiants si nécessaire
   */
  private validateTransaction(transaction: CreateTransactionRequest): void {
    // Vérifier l'existence du compte émetteur
    const emitterAccount = this.demoDataService.getAccountById(transaction.emitterAccountId);
    if (!emitterAccount) {
      throw new Error('Compte émetteur introuvable');
    }

    // Vérifier l'existence du compte destinataire (sauf si externe)
    if (!transaction.receiverAccountId.startsWith('ext-')) {
      // NOUVELLE LOGIQUE: Essayer de trouver par ID d'abord, puis par numéro de compte
      let receiverAccount = this.demoDataService.getAccountById(transaction.receiverAccountId);

      // Si non trouvé par ID, essayer par numéro de compte (IBAN)
      if (!receiverAccount) {
        receiverAccount = this.demoDataService.getAccountByAccountNumber(transaction.receiverAccountId);

        // Si trouvé par numéro, remplacer l'ID dans la transaction par l'ID interne
        if (receiverAccount) {
          console.log(`TransactionsService: Compte trouvé par IBAN, utilisation de l'ID interne: ${receiverAccount.id}`);
          transaction.receiverAccountId = receiverAccount.id;
        }
      }

      if (!receiverAccount) {
        throw new Error('Compte destinataire introuvable');
      }

      // Vérifier que ce n'est pas le même compte
      if (transaction.emitterAccountId === transaction.receiverAccountId) {
        throw new Error('Impossible d\'effectuer un virement vers le même compte');
      }
    }

    // Vérifier que le montant est positif
    if (transaction.amount <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    // Vérifier que le compte émetteur a un solde suffisant
    if (emitterAccount.balance < transaction.amount) {
      throw new Error(`Solde insuffisant (${emitterAccount.balance}€) pour effectuer ce virement de ${transaction.amount}€`);
    }
  }

  /**
   * Implémentation avec l'API réelle
   */
  private createRealTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    // IMPORTANT: Pour le mode API réelle, on doit également gérer le cas où l'IBAN est utilisé
    // mais l'API attend un UUID. Nous devons donc résoudre l'IBAN vers l'UUID avant d'envoyer à l'API.

    try {
      // Si receiverAccountId ressemble à un IBAN (commence par "FR")
      if (transaction.receiverAccountId.startsWith('FR')) {
        // En production, vous feriez une requête API supplémentaire pour résoudre l'IBAN
        // Ici, nous simulons cette résolution
        console.log("TransactionsService: Tentative de résolution d'IBAN vers UUID avant envoi à l'API");
        const demoAccount = this.demoDataService.getAccountByAccountNumber(transaction.receiverAccountId);

        if (demoAccount) {
          // Remplacer l'IBAN par l'UUID avant d'envoyer à l'API
          console.log(`TransactionsService: IBAN résolu vers UUID: ${demoAccount.id}`);
          transaction.receiverAccountId = demoAccount.id;
        }
      }
    } catch (error) {
      console.warn('TransactionsService: Erreur lors de la résolution IBAN->UUID:', error);
      // Continuer avec la valeur originale, l'API décidera
    }

    return this.http.post<TransactionResponse>(`${this.apiUrl}/transactions/emit`, transaction).pipe(
      tap(() => {
        // Notifier le système des mises à jour après réponse positive de l'API
        this.dataUpdateService.notifyAccountsUpdated();
        this.dataUpdateService.notifyTransactionsUpdated(transaction.emitterAccountId);
        if (!transaction.receiverAccountId.startsWith('ext-')) {
          this.dataUpdateService.notifyTransactionsUpdated(transaction.receiverAccountId);
        }
      }),
      catchError(error => {
        console.error('TransactionsService: API error creating transaction', error);

        if (error.status === 400 && error.error?.message?.includes('insufficient funds')) {
          return throwError(() => new Error('Solde insuffisant pour effectuer cette transaction'));
        }

        if (error.status === 403) {
          return throwError(() => new Error('Accès refusé. Veuillez vérifier vos droits ou votre connexion'));
        }

        if (error.status === 404) {
          return throwError(() => new Error('Compte destinataire introuvable'));
        }

        return throwError(() => new Error('Erreur lors de la transaction. Veuillez réessayer plus tard'));
      })
    );
  }
}
