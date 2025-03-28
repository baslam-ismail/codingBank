
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { User } from '../../models/user.model';

/**
 * Service pour gérer les données de démonstration avec persistance
 */
@Injectable({
  providedIn: 'root'
})
export class DemoDataService {

  private readonly STORAGE_ACCOUNTS_KEY = 'demo_user_accounts';
  private readonly STORAGE_TRANSACTIONS_KEY = 'demo_user_transactions';
  private readonly STORAGE_CURRENT_USER_KEY = 'demo_current_user';


  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();


  private userAccounts: Map<string, Account[]> = new Map();


  private userTransactions: Map<string, Transaction[]> = new Map();

  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  constructor() {
    console.log('DemoDataService: Initialized');


    this.loadFromStorage();

    if (this.userAccounts.size === 0) {
      this.initDefaultUser();
    }
  }

  /**
   * Charge les données depuis le localStorage
   */
  private loadFromStorage(): void {
    try {

      const accountsJson = localStorage.getItem(this.STORAGE_ACCOUNTS_KEY);
      if (accountsJson) {
        const accountsData = JSON.parse(accountsJson);
        Object.keys(accountsData).forEach(clientCode => {
          this.userAccounts.set(clientCode, accountsData[clientCode]);
        });
        console.log('DemoDataService: Loaded accounts from localStorage:', this.userAccounts);
      }

      const transactionsJson = localStorage.getItem(this.STORAGE_TRANSACTIONS_KEY);
      if (transactionsJson) {
        const transactionsData = JSON.parse(transactionsJson);
        Object.keys(transactionsData).forEach(clientCode => {
          this.userTransactions.set(clientCode, transactionsData[clientCode]);
        });
        console.log('DemoDataService: Loaded transactions from localStorage:', this.userTransactions);
      }


      const currentUserJson = localStorage.getItem(this.STORAGE_CURRENT_USER_KEY);
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        this.setCurrentUser(currentUser, false); // Ne pas sauvegarder pour éviter une boucle
        console.log('DemoDataService: Loaded current user from localStorage:', currentUser);
      }
    } catch (error) {
      console.error('DemoDataService: Error loading from localStorage', error);
    }
  }

  /**
   * Sauvegarde les données dans le localStorage
   */
  private saveToStorage(): void {
    try {

      const accountsObj: {[key: string]: Account[]} = {};
      this.userAccounts.forEach((accounts, clientCode) => {
        accountsObj[clientCode] = accounts;
      });
      localStorage.setItem(this.STORAGE_ACCOUNTS_KEY, JSON.stringify(accountsObj));


      const transactionsObj: {[key: string]: Transaction[]} = {};
      this.userTransactions.forEach((transactions, clientCode) => {
        transactionsObj[clientCode] = transactions;
      });
      localStorage.setItem(this.STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactionsObj));


      const currentUser = this.currentUserSubject.getValue();
      if (currentUser) {
        localStorage.setItem(this.STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
      }

      console.log('DemoDataService: Saved data to localStorage');
    } catch (error) {
      console.error('DemoDataService: Error saving to localStorage', error);
    }
  }

  /**
   * Initialise l'utilisateur de démo par défaut avec ses comptes
   */
  private initDefaultUser(): void {
    const defaultUser: User = {
      clientCode: '12345678',
      name: 'Utilisateur Démo'
    };


    const defaultAccounts: Account[] = [
      {
        id: 'acc-checking-' + defaultUser.clientCode,
        label: 'Compte Courant',
        balance: 1000.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: defaultUser.clientCode,
        accountNumber: 'FR76 1234 5678 0000 0000 0000 000',
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-savings-' + defaultUser.clientCode,
        label: 'Livret Épargne',
        balance: 2000.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: defaultUser.clientCode,
        accountNumber: 'FR76 1234 5678 1111 1111 1111 111',
        type: 'SAVINGS',
        currency: 'EUR'
      }
    ];


    const defaultTransactions: Transaction[] = [];


    this.userAccounts.set(defaultUser.clientCode, defaultAccounts);
    this.userTransactions.set(defaultUser.clientCode, defaultTransactions);


    this.setCurrentUser(defaultUser);

    console.log('DemoDataService: Default user initialized', defaultUser);
  }

  /**
   * Définit l'utilisateur courant et charge ses données
   */
  setCurrentUser(user: User, saveToStorage: boolean = true): void {
    console.log('DemoDataService: Setting current user', user);

    this.currentUserSubject.next(user);


    if (!this.userAccounts.has(user.clientCode)) {
      this.userAccounts.set(user.clientCode, []);
    }


    if (!this.userTransactions.has(user.clientCode)) {
      this.userTransactions.set(user.clientCode, []);
    }

    this.accountsSubject.next(this.getUserAccounts(user.clientCode));
    this.transactionsSubject.next(this.getUserTransactions(user.clientCode));


    if (saveToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Obtient les comptes de l'utilisateur actuel
   */
  getAccounts(): Observable<Account[]> {
    return this.accountsSubject.asObservable();
  }

  /**
   * Obtient les comptes actuels (snapshot)
   */
  getCurrentAccounts(): Account[] {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) return [];

    return this.getUserAccounts(currentUser.clientCode);
  }

  /**
   * Obtient les transactions de l'utilisateur actuel
   */
  getTransactions(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  /**
   * Obtient les transactions actuelles (snapshot)
   */
  getCurrentTransactions(): Transaction[] {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) return [];

    return this.getUserTransactions(currentUser.clientCode);
  }

  /**
   * Obtient un compte par son ID interne (UUID)
   */
  getAccountById(accountId: string): Account | null {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) return null;

    const accounts = this.getUserAccounts(currentUser.clientCode);
    const account = accounts.find(a => a.id === accountId);

    console.log(`DemoDataService: getAccountById(${accountId}) returned:`, account);
    return account || null;
  }

  /**
   * Obtient un compte par son numéro IBAN
   */
  getAccountByAccountNumber(accountNumber: string): Account | null {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) return null;

    // Normaliser le numéro de compte (enlever les espaces)
    const cleanAccountNumber = accountNumber.replace(/\s+/g, '');

    console.log(`DemoDataService: Recherche de compte par numéro IBAN: ${cleanAccountNumber}`);

    const accounts = this.getUserAccounts(currentUser.clientCode);


    const account = accounts.find(acc => {
      const cleanStoredNumber = (acc.accountNumber || '').replace(/\s+/g, '');
      return cleanStoredNumber === cleanAccountNumber;
    });

    console.log(`DemoDataService: Compte trouvé par IBAN:`, account);
    return account || null;
  }

  /**
   * Obtient les transactions d'un compte
   */
  getTransactionsByAccountId(accountId: string): Transaction[] {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) return [];

    const transactions = this.getUserTransactions(currentUser.clientCode);

    const filtered = transactions.filter(
      t => t.emitterAccountId === accountId || t.receiverAccountId === accountId
    );

    console.log(`DemoDataService: Found ${filtered.length} transactions for account ${accountId}`);
    return filtered;
  }

  /**
   * Ajoute une transaction
   */
  addTransaction(transaction: Transaction): void {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) {
      console.error('DemoDataService: Cannot add transaction, no current user');
      return;
    }

    console.log('DemoDataService: Adding transaction:', transaction);


    const transactions = this.getUserTransactions(currentUser.clientCode);


    const updatedTransactions = [transaction, ...transactions];

    this.userTransactions.set(currentUser.clientCode, updatedTransactions);


    this.transactionsSubject.next(updatedTransactions);

    console.log('DemoDataService: Transaction added, total count:', updatedTransactions.length);

    this.saveToStorage();
  }

  /**
   * Met à jour les soldes des comptes suite à une transaction
   */
  updateAccountBalances(transaction: Transaction): void {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) {
      console.error('DemoDataService: Cannot update balances, no current user');
      return;
    }

    console.log('DemoDataService: Updating account balances for transaction:', transaction);


    const accounts = this.getUserAccounts(currentUser.clientCode);


    const emitterIndex = accounts.findIndex(a => a.id === transaction.emitterAccountId);
    const receiverIndex = accounts.findIndex(a => a.id === transaction.receiverAccountId);

    console.log('DemoDataService: Account indices - emitter:', emitterIndex, 'receiver:', receiverIndex);
    console.log('DemoDataService: Account balances before update - ',
      accounts.map(a => `${a.id}: ${a.balance}`));

    if (emitterIndex === -1) {
      console.error(`DemoDataService: Emitter account ${transaction.emitterAccountId} not found`);
      throw new Error('Compte émetteur introuvable');
    }


    const updatedAccounts = [...accounts];


    const emitterOldBalance = updatedAccounts[emitterIndex].balance;
    updatedAccounts[emitterIndex] = {
      ...updatedAccounts[emitterIndex],
      balance: Math.round((emitterOldBalance - transaction.amount) * 100) / 100,
      updatedAt: new Date().toISOString()
    };
    console.log(`DemoDataService: Updated emitter ${transaction.emitterAccountId} balance: ${emitterOldBalance} -> ${updatedAccounts[emitterIndex].balance}`);


    if (receiverIndex !== -1) {
      const receiverOldBalance = updatedAccounts[receiverIndex].balance;
      updatedAccounts[receiverIndex] = {
        ...updatedAccounts[receiverIndex],
        balance: Math.round((receiverOldBalance + transaction.amount) * 100) / 100,
        updatedAt: new Date().toISOString()
      };
      console.log(`DemoDataService: Updated receiver ${transaction.receiverAccountId} balance: ${receiverOldBalance} -> ${updatedAccounts[receiverIndex].balance}`);
    } else {
      console.log(`DemoDataService: Receiver ${transaction.receiverAccountId} is external or belongs to another user, no balance update needed`);
    }


    this.userAccounts.set(currentUser.clientCode, updatedAccounts);


    this.accountsSubject.next(updatedAccounts);

    console.log('DemoDataService: Account balances after update - ',
      updatedAccounts.map(a => `${a.id}: ${a.balance}`));


    this.saveToStorage();
  }

  /**
   * Crée un nouvel utilisateur avec des comptes par défaut
   * @param user Données de l'utilisateur
   * @param initialBalance Solde initial pour les nouveaux comptes (défaut: 250)
   */
  createNewUser(user: User, initialBalance: number = 250): void {
    console.log(`DemoDataService: Creating new user with initial balance ${initialBalance}€`, user);

    // Vérifier que l'utilisateur n'existe pas déjà
    if (this.userAccounts.has(user.clientCode)) {
      console.warn(`DemoDataService: User with clientCode ${user.clientCode} already exists, data will be overwritten`);
    }

    const generateIBAN = (clientCode: string, suffix: string): string => {
      return `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} ${suffix}`;
    };

    const newAccounts: Account[] = [
      {
        id: 'acc-checking-' + user.clientCode,
        label: 'Compte Courant',
        balance: initialBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.clientCode,
        accountNumber: generateIBAN(user.clientCode, '0000 0000 0000 000'),
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-savings-' + user.clientCode,
        label: 'Livret Épargne',
        balance: initialBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.clientCode,
        accountNumber: generateIBAN(user.clientCode, '1111 1111 1111 111'),
        type: 'SAVINGS',
        currency: 'EUR'
      }
    ];


    const newTransactions: Transaction[] = [];

    this.userAccounts.set(user.clientCode, newAccounts);
    this.userTransactions.set(user.clientCode, newTransactions);

    console.log(`DemoDataService: New user created with ${newAccounts.length} accounts`, newAccounts);


    this.setCurrentUser(user);
  }

  /**
   * Réinitialise les données pour l'utilisateur actuel
   * @param initialCheckingBalance Solde initial pour le compte courant (défaut: 1000)
   * @param initialSavingsBalance Solde initial pour l'épargne (défaut: 2000)
   */
  resetCurrentUserData(initialCheckingBalance: number = 1000, initialSavingsBalance: number = 2000): void {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) {
      console.error('DemoDataService: Cannot reset data, no current user');
      return;
    }

    console.log(`DemoDataService: Resetting data for user ${currentUser.clientCode}`);


    if (currentUser.clientCode !== '12345678') {
      initialCheckingBalance = 250;
      initialSavingsBalance = 250;
    }

    const generateIBAN = (clientCode: string, suffix: string): string => {
      return `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} ${suffix}`;
    };


    const resetAccounts: Account[] = [
      {
        id: 'acc-checking-' + currentUser.clientCode,
        label: 'Compte Courant',
        balance: initialCheckingBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.clientCode,
        accountNumber: generateIBAN(currentUser.clientCode, '0000 0000 0000 000'),
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-savings-' + currentUser.clientCode,
        label: 'Livret Épargne',
        balance: initialSavingsBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.clientCode,
        accountNumber: generateIBAN(currentUser.clientCode, '1111 1111 1111 111'),
        type: 'SAVINGS',
        currency: 'EUR'
      }
    ];


    const resetTransactions: Transaction[] = [];


    this.userAccounts.set(currentUser.clientCode, resetAccounts);
    this.userTransactions.set(currentUser.clientCode, resetTransactions);


    this.accountsSubject.next(resetAccounts);
    this.transactionsSubject.next(resetTransactions);

    console.log('DemoDataService: User data has been reset');


    this.saveToStorage();
  }

  /**
   * Réinitialise toutes les données (pour les tests)
   */
  resetAllData(): void {
    console.log('DemoDataService: Resetting all data');

    // Vider les maps
    this.userAccounts.clear();
    this.userTransactions.clear();

    // Vider le localStorage
    localStorage.removeItem(this.STORAGE_ACCOUNTS_KEY);
    localStorage.removeItem(this.STORAGE_TRANSACTIONS_KEY);
    localStorage.removeItem(this.STORAGE_CURRENT_USER_KEY);


    this.initDefaultUser();
  }

  private getUserAccounts(clientCode: string): Account[] {
    return this.userAccounts.get(clientCode) || [];
  }


  private getUserTransactions(clientCode: string): Transaction[] {
    return this.userTransactions.get(clientCode) || [];
  }

  public switchUser(user: User): void {
    console.log('DemoDataService: Switching to user:', user);

    // Force reload all data
    this.loadFromStorage();

    // Set current user
    this.setCurrentUser(user);

    // Force update observables
    const accounts = this.getUserAccounts(user.clientCode);
    const transactions = this.getUserTransactions(user.clientCode);

    // Update observables
    this.accountsSubject.next(accounts);
    this.transactionsSubject.next(transactions);

    console.log('DemoDataService: User switched, accounts:', accounts.length);
  }
}
