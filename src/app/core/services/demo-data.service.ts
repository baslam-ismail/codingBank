// src/app/core/services/demo-data.service.ts

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { User } from '../../models/user.model';
import { AuthService } from '../authentication/auth.service';

/**
 * Service pour gérer les données de démonstration par utilisateur
 */
@Injectable({
  providedIn: 'root'
})
export class DemoDataService {
  // Utilisateurs de démo prédéfinis
  private predefinedUsers: User[] = [
    { clientCode: '12345678', name: 'Jean Dupont' },
    { clientCode: '87654321', name: 'Marie Martin' }
  ];

  // Comptes de démo par utilisateur (clé = clientCode)
  private userAccounts: Record<string, Account[]> = {
    // Comptes pour Jean Dupont
    '12345678': [
      {
        id: 'acc-12345678',
        label: 'Compte Courant',
        balance: 2500.75,
        createdAt: new Date(2023, 0, 15).toISOString(),
        updatedAt: new Date(2023, 5, 10).toISOString(),
        userId: 'user-12345678',
        accountNumber: 'FR76 1234 5678 9012 3456 7890 123',
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-98765432',
        label: 'Livret A',
        balance: 5680.42,
        createdAt: new Date(2023, 1, 20).toISOString(),
        updatedAt: new Date(2023, 5, 1).toISOString(),
        userId: 'user-12345678',
        accountNumber: 'FR76 9876 5432 1098 7654 3210 987',
        type: 'SAVINGS',
        currency: 'EUR'
      }
    ],
    // Comptes pour Marie Martin
    '87654321': [
      {
        id: 'acc-56781234',
        label: 'Compte Courant',
        balance: 1800.25,
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 15).toISOString(),
        userId: 'user-87654321',
        accountNumber: 'FR76 5678 1234 5678 9012 3456 789',
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-43215678',
        label: 'PEL',
        balance: 10250.00,
        createdAt: new Date(2022, 11, 5).toISOString(),
        updatedAt: new Date(2023, 7, 20).toISOString(),
        userId: 'user-87654321',
        accountNumber: 'FR76 4321 5678 4321 5678 9012 345',
        type: 'TERM_DEPOSIT',
        currency: 'EUR'
      }
    ]
  };

  // Transactions de démo par utilisateur (clé = clientCode)
  private userTransactions: Record<string, Transaction[]> = {
    // Transactions pour Jean Dupont
    '12345678': [
      {
        id: 'tx-12345',
        amount: 750.00,
        description: 'Salaire Mars 2023',
        emitterAccountId: 'ext-employer',
        receiverAccountId: 'acc-12345678',
        createdAt: new Date(2023, 2, 28).toISOString(),
        updatedAt: new Date(2023, 2, 28).toISOString()
      },
      {
        id: 'tx-23456',
        amount: 42.50,
        description: 'Courses Carrefour',
        emitterAccountId: 'acc-12345678',
        receiverAccountId: 'ext-carrefour',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 3, 5).toISOString()
      }
    ],
    // Transactions pour Marie Martin
    '87654321': [
      {
        id: 'tx-78901',
        amount: 950.00,
        description: 'Remboursement prêt',
        emitterAccountId: 'ext-friend',
        receiverAccountId: 'acc-56781234',
        createdAt: new Date(2023, 4, 15).toISOString(),
        updatedAt: new Date(2023, 4, 15).toISOString()
      },
      {
        id: 'tx-89012',
        amount: 320.75,
        description: 'Loyer Avril',
        emitterAccountId: 'acc-56781234',
        receiverAccountId: 'ext-landlord',
        createdAt: new Date(2023, 3, 2).toISOString(),
        updatedAt: new Date(2023, 3, 2).toISOString()
      }
    ]
  };

  // Sujets BehaviorSubject pour les comptes et transactions de l'utilisateur actuel
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  // Service d'authentification pour obtenir l'utilisateur actuel
  // private authService = inject(AuthService);
  private currentUserCode: string | null = null;

  constructor(private authService : AuthService) {
    console.log('DemoDataService initialized');
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserCode = user.clientCode;
        this.loadUserData(user.clientCode);
      } else {
        this.currentUserCode = null;
        this.accountsSubject.next([]);
        this.transactionsSubject.next([]);
      }
    });
  }

  // Charger les données de l'utilisateur
  private loadUserData(clientCode: string): void {
    console.log(`Loading demo data for user ${clientCode}`);

    // Si l'utilisateur existe déjà dans notre système
    if (this.userAccounts[clientCode]) {
      this.accountsSubject.next(this.userAccounts[clientCode]);
    } else {
      // Créer des comptes par défaut pour un nouvel utilisateur
      this.userAccounts[clientCode] = this.createDefaultAccounts(clientCode);
      this.accountsSubject.next(this.userAccounts[clientCode]);
    }

    if (this.userTransactions[clientCode]) {
      this.transactionsSubject.next(this.userTransactions[clientCode]);
    } else {
      // Créer des transactions par défaut pour un nouvel utilisateur
      this.userTransactions[clientCode] = [];
      this.transactionsSubject.next([]);
    }
  }

  // Créer des comptes par défaut pour un nouvel utilisateur
  private createDefaultAccounts(clientCode: string): Account[] {
    const userId = `user-${clientCode}`;
    return [
      {
        id: `acc-${Math.random().toString(36).substring(2, 10)}`,
        label: 'Compte Courant',
        balance: 1000.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId,
        accountNumber: `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} 0000 0000 0000 000`,
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: `acc-${Math.random().toString(36).substring(2, 10)}`,
        label: 'Livret Épargne',
        balance: 2000.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId,
        accountNumber: `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} 1111 1111 1111 111`,
        type: 'SAVINGS',
        currency: 'EUR'
      }
    ];
  }

  // Getters pour les données de démo
  getAccounts(): Observable<Account[]> {
    return this.accountsSubject.asObservable();
  }

  getCurrentAccounts(): Account[] {
    return this.accountsSubject.getValue();
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  getCurrentTransactions(): Transaction[] {
    return this.transactionsSubject.getValue();
  }

  getUsers(): User[] {
    return this.predefinedUsers;
  }

  // Méthodes pour manipuler les données
  addTransaction(transaction: Transaction): void {
    if (!this.currentUserCode) {
      console.error('No current user to add transaction');
      return;
    }

    // Ajouter la transaction à la liste de l'utilisateur actuel
    const currentTransactions = this.userTransactions[this.currentUserCode] || [];
    this.userTransactions[this.currentUserCode] = [transaction, ...currentTransactions];
    this.transactionsSubject.next(this.userTransactions[this.currentUserCode]);

    // Mettre à jour les soldes des comptes
    this.updateAccountBalances(transaction);

    console.log('Transaction added:', transaction);
    console.log('Updated transactions:', this.userTransactions[this.currentUserCode]);
  }

  updateAccountBalances(transaction: Transaction): void {
    if (!this.currentUserCode) {
      console.error('No current user to update account balances');
      return;
    }

    const currentAccounts = this.userAccounts[this.currentUserCode] || [];

    const updatedAccounts = currentAccounts.map(account => {
      // Si c'est le compte émetteur, on réduit le solde
      if (account.id === transaction.emitterAccountId) {
        return {
          ...account,
          balance: account.balance - transaction.amount,
          updatedAt: new Date().toISOString()
        };
      }

      // Si c'est le compte destinataire, on augmente le solde
      if (account.id === transaction.receiverAccountId) {
        return {
          ...account,
          balance: account.balance + transaction.amount,
          updatedAt: new Date().toISOString()
        };
      }

      return account;
    });

    this.userAccounts[this.currentUserCode] = updatedAccounts;
    this.accountsSubject.next(updatedAccounts);
  }

  getAccountById(accountId: string): Account | null {
    const accounts = this.accountsSubject.getValue();
    return accounts.find(account => account.id === accountId) || null;
  }

  getTransactionsByAccountId(accountId: string): Transaction[] {
    const transactions = this.transactionsSubject.getValue();
    return transactions.filter(
      transaction =>
        transaction.emitterAccountId === accountId ||
        transaction.receiverAccountId === accountId
    );
  }

  // Ajouter un nouvel utilisateur de démo
  addUser(user: User): void {
    // Ajouter aux utilisateurs prédéfinis
    this.predefinedUsers.push(user);

    // Créer des comptes par défaut pour cet utilisateur
    if (!this.userAccounts[user.clientCode]) {
      this.userAccounts[user.clientCode] = this.createDefaultAccounts(user.clientCode);
    }

    // Initialiser les transactions pour cet utilisateur
    if (!this.userTransactions[user.clientCode]) {
      this.userTransactions[user.clientCode] = [];
    }
  }
}
