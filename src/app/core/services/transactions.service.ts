import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Transaction,
  CreateTransactionRequest,
  TransactionResponse
} from '../../models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Récupérer l'historique des transactions pour un compte
  getTransactionsByAccountId(accountId: string): Observable<Transaction[]> {
    // Si en mode démo, retourner directement des données mockées
    if (environment.demo) {
      return of(this.getMockTransactions(accountId));
    }

    // Sinon, faire une requête au backend réel
    return this.http.get<Transaction[]>(`${this.apiUrl}/accounts/${accountId}/transactions`).pipe(
      catchError(error => {
        console.error('Error fetching transactions', error);
        // En cas d'erreur, retourner des données mockées
        return of(this.getMockTransactions(accountId));
      })
    );
  }

  createTransaction(transaction: CreateTransactionRequest): Observable<TransactionResponse> {
    // Si en mode démo, simuler une transaction réussie
    if (environment.demo) {
      // Vérifier si les comptes existent et si le solde est suffisant
      // (Simulation d'une validation backend)
      if (transaction.amount <= 0) {
        return throwError(() => new Error('Le montant doit être supérieur à 0.'));
      }

      // En mode démo, créer une réponse simulée
      return of(this.createMockTransactionResponse(transaction));
    }

    // Sinon, envoyer la transaction au backend réel
    return this.http.post<TransactionResponse>(`${this.apiUrl}/transactions/emit`, transaction).pipe(
      catchError(error => {
        console.error('Error creating transaction', error);

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

  protected getMockTransactions(accountId: string): Transaction[] {
    // Fonction pour générer une date récente
    const getRecentDate = (daysAgo: number): string => {
      const date = new Date();
      date.setDate(date.getDate() - Math.min(Math.floor(Math.random() * daysAgo), 30));
      return date.toISOString();
    };

    // Fonction pour générer un ID de transaction
    const generateId = (): string => 'TR' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // ID d'un autre compte fictif pour les transactions
    const otherAccountId = 'acc-' + Math.random().toString(36).substring(2, 10);

    // Descriptions possibles pour les transactions
    const descriptions = [
      'Achat Carrefour',
      'Restaurant Le Petit Bistro',
      'SNCF Train',
      'Virement Salaire',
      'Loyer Avril 2023',
      'EDF Facture Mensuelle',
      'Orange Internet',
      'Remboursement Jean',
      'Assurance Habitation',
      'Amazon Commande'
    ];

    // Création de transactions mockées
    const transactions: Transaction[] = [];
    const numTransactions = 5 + Math.floor(Math.random() * 5); // Entre 5 et 10 transactions

    for (let i = 0; i < numTransactions; i++) {
      const isIncoming = Math.random() > 0.6; // 40% des transactions sont entrantes
      const amount = Math.round(Math.random() * 500 * 100) / 100; // Montant entre 0 et 500
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const daysAgo = i + 1; // Pour avoir des dates différentes

      transactions.push({
        id: generateId(),
        // Montant toujours positif dans le modèle de données
        amount: Math.abs(amount),
        description: description,
        // Si entrant, l'émetteur est un autre compte et le récepteur est ce compte
        // Si sortant, l'émetteur est ce compte et le récepteur est un autre compte
        emitterAccountId: isIncoming ? otherAccountId : accountId,
        receiverAccountId: isIncoming ? accountId : otherAccountId,
        createdAt: getRecentDate(daysAgo),
        updatedAt: getRecentDate(daysAgo)
      });
    }

    return transactions.sort((a, b) =>
      new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()
    );
  }

  // Simulation de réponse pour une nouvelle transaction
  protected createMockTransactionResponse(request: CreateTransactionRequest): TransactionResponse {
    return {
      id: Math.random().toString(36).substring(2, 15),
      ...request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
