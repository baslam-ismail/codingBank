import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {forkJoin, mergeMap, Observable, of, throwError} from 'rxjs';
import {catchError, delay, map, tap} from 'rxjs/operators';
import {
  Transaction,
  CreateTransactionRequest,
  TransactionResponse
} from '../../models/transaction.model';
import { environment } from '../../../environments/environment';
import { DemoDataService } from './demo-data.service';
import { DataUpdateService } from './data-update.service';
import {Account} from '../../models/account.model';

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


    if (environment.demo) {
      console.log(`TransactionsService: Using demo mode for account ${accountId}`);
      const transactions = this.demoDataService.getTransactionsByAccountId(accountId);
      return of(transactions).pipe(
        delay(300), // Simuler un délai réseau
        tap(() => console.log(`TransactionsService: Returned ${transactions.length} demo transactions`))
      );
    }

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


    if (environment.demo) {
      return this.createDemoTransaction(transaction);
    }


    return this.createRealTransaction(transaction);
  }

  /**
   * Implémentation du mode démo pour créer une transaction
   */
  private createDemoTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    console.log('TransactionsService: Création d\'une transaction en mode démo');

    try {

      console.log('TransactionsService: Validation des données de transaction');
      this.validateTransaction(transaction);
      console.log('TransactionsService: Validation réussie, ID destinataire résolu:', transaction.receiverAccountId);


      const newTransaction: Transaction = {
        id: 'tx-' + Date.now(),
        amount: Math.round(transaction.amount * 100) / 100,
        description: transaction.description,
        emitterAccountId: transaction.emitterAccountId,
        receiverAccountId: transaction.receiverAccountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'COMPLETED'
      };


      console.log('TransactionsService: Mise à jour des soldes pour la transaction');
      this.demoDataService.updateAccountBalances(newTransaction);


      console.log('TransactionsService: Ajout de la transaction à l\'historique');
      this.demoDataService.addTransaction(newTransaction);

      console.log('TransactionsService: Envoi des notifications de mise à jour');
      this.dataUpdateService.notifyAccountsUpdated();
      this.dataUpdateService.notifyTransactionsUpdated(transaction.emitterAccountId);
      if (!transaction.receiverAccountId.startsWith('ext-')) {
        this.dataUpdateService.notifyTransactionsUpdated(transaction.receiverAccountId);
      }

      console.log('TransactionsService: Transaction créée avec succès:', newTransaction);


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

    const emitterAccount = this.demoDataService.getAccountById(transaction.emitterAccountId);
    if (!emitterAccount) {
      throw new Error('Compte émetteur introuvable');
    }

    if (!transaction.receiverAccountId.startsWith('ext-')) {

      let receiverAccount = this.demoDataService.getAccountById(transaction.receiverAccountId);

      if (!receiverAccount) {
        receiverAccount = this.demoDataService.getAccountByAccountNumber(transaction.receiverAccountId);

        if (receiverAccount) {
          console.log(`TransactionsService: Compte trouvé par IBAN, utilisation de l'ID interne: ${receiverAccount.id}`);
          transaction.receiverAccountId = receiverAccount.id;
        }
      }

      if (!receiverAccount) {
        throw new Error('Compte destinataire introuvable');
      }

      if (transaction.emitterAccountId === transaction.receiverAccountId) {
        throw new Error('Impossible d\'effectuer un virement vers le même compte');
      }
    }


    if (transaction.amount <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }


    if (emitterAccount.balance < transaction.amount) {
      throw new Error(`Solde insuffisant (${emitterAccount.balance}€) pour effectuer ce virement de ${transaction.amount}€`);
    }
  }

  /**
   * Implémentation avec l'API réelle
   */
  private createRealTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {

    try {

      if (transaction.receiverAccountId.startsWith('FR')) {

        console.log("TransactionsService: Tentative de résolution d'IBAN vers UUID avant envoi à l'API");
        const demoAccount = this.demoDataService.getAccountByAccountNumber(transaction.receiverAccountId);

        if (demoAccount) {

          console.log(`TransactionsService: IBAN résolu vers UUID: ${demoAccount.id}`);
          transaction.receiverAccountId = demoAccount.id;
        }
      }
    } catch (error) {
      console.warn('TransactionsService: Erreur lors de la résolution IBAN->UUID:', error);

    }

    return this.http.post<TransactionResponse>(`${this.apiUrl}/transactions/emit`, transaction).pipe(
      tap(() => {

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

  getTransactionById(transactionId: string): Observable<Transaction | null> {
    console.log(`TransactionsService: Getting transaction details for ID ${transactionId}`);


    if (environment.demo) {
      console.log('TransactionsService: Using demo mode for transaction details');

      const allTransactions = this.demoDataService.getCurrentTransactions();

      const transaction = allTransactions.find(t => t.id === transactionId);

      if (transaction) {
        return of(transaction).pipe(
          delay(300), // Simuler un délai réseau
          tap(() => console.log(`TransactionsService: Found demo transaction details`, transaction))
        );
      } else {
        console.error(`TransactionsService: Transaction with ID ${transactionId} not found`);
        return throwError(() => new Error('Transaction introuvable'));
      }
    }

    // En mode API réelle
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${transactionId}`).pipe(
      tap(transaction => console.log(`TransactionsService: API returned transaction details`, transaction)),
      catchError(error => {
        console.error('TransactionsService: API error fetching transaction details', error);
        if (error.status === 404) {
          return throwError(() => new Error('Transaction introuvable'));
        }
        return throwError(() => new Error('Erreur lors de la récupération des détails de la transaction'));
      })
    );
  }

  getAllTransactions(): Observable<Transaction[]> {
    console.log('TransactionsService: Getting all transactions');

    // En mode démo
    if (environment.demo) {
      const transactions = this.demoDataService.getCurrentTransactions();
      return of(transactions).pipe(
        delay(300),
        tap(() => console.log(`TransactionsService: Returned ${transactions.length} demo transactions`))
      );
    }


    return this.http.get<Account[]>(`${this.apiUrl}/accounts`).pipe(
      tap(accounts => console.log('TransactionsService: Got accounts', accounts)),
      mergeMap(accounts => {
        if (accounts.length === 0) {
          return of([]);  // Aucun compte, donc aucune transaction
        }


        const transactionRequests = accounts.map(account =>
          this.http.get<Transaction[]>(`${this.apiUrl}/accounts/${account.id}/transactions`).pipe(
            catchError(error => {
              console.warn(`Error fetching transactions for account ${account.id}`, error);
              return of([]);  // En cas d'erreur, retourner un tableau vide
            })
          )
        );

        return forkJoin(transactionRequests).pipe(
          map(transactionsArrays => {

            const allTransactions = transactionsArrays.flat();
            console.log(`TransactionsService: Combined ${allTransactions.length} transactions from all accounts`);
            return allTransactions;
          })
        );
      }),
      catchError(error => {
        console.error('TransactionsService: API error fetching all transactions', error);
        return of([]);
      })
    );
  }
}
