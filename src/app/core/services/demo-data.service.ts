// src/app/core/services/demo-data.service.ts
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
  // Clés pour le stockage localStorage
  private readonly STORAGE_ACCOUNTS_KEY = 'demo_user_accounts';
  private readonly STORAGE_TRANSACTIONS_KEY = 'demo_user_transactions';
  private readonly STORAGE_CURRENT_USER_KEY = 'demo_current_user';

  // Utilisateur courant
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Map des comptes par utilisateur: clientCode -> Account[]
  private userAccounts: Map<string, Account[]> = new Map();

  // Map des transactions par utilisateur: clientCode -> Transaction[]
  private userTransactions: Map<string, Transaction[]> = new Map();

  // Observables pour communiquer les changements
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  constructor() {
    console.log('DemoDataService: Initialized');

    // Charger les données du localStorage
    this.loadFromStorage();

    // Si aucune donnée n'existe, initialiser l'utilisateur de démo par défaut
    if (this.userAccounts.size === 0) {
      this.initDefaultUser();
    }
  }

  /**
   * Charge les données depuis le localStorage
   */
  private loadFromStorage(): void {
    try {
      // Charger les comptes
      const accountsJson = localStorage.getItem(this.STORAGE_ACCOUNTS_KEY);
      if (accountsJson) {
        const accountsData = JSON.parse(accountsJson);
        Object.keys(accountsData).forEach(clientCode => {
          this.userAccounts.set(clientCode, accountsData[clientCode]);
        });
        console.log('DemoDataService: Loaded accounts from localStorage:', this.userAccounts);
      }

      // Charger les transactions
      const transactionsJson = localStorage.getItem(this.STORAGE_TRANSACTIONS_KEY);
      if (transactionsJson) {
        const transactionsData = JSON.parse(transactionsJson);
        Object.keys(transactionsData).forEach(clientCode => {
          this.userTransactions.set(clientCode, transactionsData[clientCode]);
        });
        console.log('DemoDataService: Loaded transactions from localStorage:', this.userTransactions);
      }

      // Charger l'utilisateur courant
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
      // Convertir Map en objet pour le stockage
      const accountsObj: {[key: string]: Account[]} = {};
      this.userAccounts.forEach((accounts, clientCode) => {
        accountsObj[clientCode] = accounts;
      });
      localStorage.setItem(this.STORAGE_ACCOUNTS_KEY, JSON.stringify(accountsObj));

      // Convertir Map en objet pour le stockage
      const transactionsObj: {[key: string]: Transaction[]} = {};
      this.userTransactions.forEach((transactions, clientCode) => {
        transactionsObj[clientCode] = transactions;
      });
      localStorage.setItem(this.STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactionsObj));

      // Sauvegarder l'utilisateur courant
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

    // Créer les comptes pour l'utilisateur par défaut
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

    // Initialiser les transactions vides
    const defaultTransactions: Transaction[] = [];

    // Stocker les données
    this.userAccounts.set(defaultUser.clientCode, defaultAccounts);
    this.userTransactions.set(defaultUser.clientCode, defaultTransactions);

    // Définir l'utilisateur courant
    this.setCurrentUser(defaultUser);

    console.log('DemoDataService: Default user initialized', defaultUser);
  }

  /**
   * Définit l'utilisateur courant et charge ses données
   */
  setCurrentUser(user: User, saveToStorage: boolean = true): void {
    console.log('DemoDataService: Setting current user', user);

    this.currentUserSubject.next(user);

    // S'assurer que l'utilisateur a des comptes
    if (!this.userAccounts.has(user.clientCode)) {
      this.userAccounts.set(user.clientCode, []);
    }

    // S'assurer que l'utilisateur a des transactions
    if (!this.userTransactions.has(user.clientCode)) {
      this.userTransactions.set(user.clientCode, []);
    }

    // Mettre à jour les sujets avec les données de l'utilisateur
    this.accountsSubject.next(this.getUserAccounts(user.clientCode));
    this.transactionsSubject.next(this.getUserTransactions(user.clientCode));

    // Sauvegarder dans le localStorage si demandé
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

    // Chercher le compte avec ce numéro
    const account = accounts.find(acc => {
      // Normaliser aussi le numéro IBAN stocké
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

    // Récupérer les transactions actuelles
    const transactions = this.getUserTransactions(currentUser.clientCode);

    // Ajouter la transaction (au début pour avoir les plus récentes d'abord)
    const updatedTransactions = [transaction, ...transactions];

    // Mettre à jour la map
    this.userTransactions.set(currentUser.clientCode, updatedTransactions);

    // Notifier les observateurs
    this.transactionsSubject.next(updatedTransactions);

    console.log('DemoDataService: Transaction added, total count:', updatedTransactions.length);

    // Sauvegarder dans le localStorage
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

    // Récupérer les comptes actuels
    const accounts = this.getUserAccounts(currentUser.clientCode);

    // Trouver les comptes concernés
    const emitterIndex = accounts.findIndex(a => a.id === transaction.emitterAccountId);
    const receiverIndex = accounts.findIndex(a => a.id === transaction.receiverAccountId);

    console.log('DemoDataService: Account indices - emitter:', emitterIndex, 'receiver:', receiverIndex);
    console.log('DemoDataService: Account balances before update - ',
      accounts.map(a => `${a.id}: ${a.balance}`));

    // Vérifier que le compte émetteur existe
    if (emitterIndex === -1) {
      console.error(`DemoDataService: Emitter account ${transaction.emitterAccountId} not found`);
      throw new Error('Compte émetteur introuvable');
    }

    // Créer une copie des comptes pour les modifier
    const updatedAccounts = [...accounts];

    // Déduire du compte émetteur
    const emitterOldBalance = updatedAccounts[emitterIndex].balance;
    updatedAccounts[emitterIndex] = {
      ...updatedAccounts[emitterIndex],
      balance: Math.round((emitterOldBalance - transaction.amount) * 100) / 100,
      updatedAt: new Date().toISOString()
    };
    console.log(`DemoDataService: Updated emitter ${transaction.emitterAccountId} balance: ${emitterOldBalance} -> ${updatedAccounts[emitterIndex].balance}`);

    // Ajouter au compte destinataire s'il n'est pas externe et appartient à l'utilisateur courant
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

    // Mettre à jour la map
    this.userAccounts.set(currentUser.clientCode, updatedAccounts);

    // Notifier les observateurs
    this.accountsSubject.next(updatedAccounts);

    console.log('DemoDataService: Account balances after update - ',
      updatedAccounts.map(a => `${a.id}: ${a.balance}`));

    // Sauvegarder dans le localStorage
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

    // Générer un numéro IBAN basé sur le code client
    const generateIBAN = (clientCode: string, suffix: string): string => {
      return `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} ${suffix}`;
    };

    // Créer des comptes pour le nouvel utilisateur
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

    // Initialiser les transactions vides
    const newTransactions: Transaction[] = [];

    // Stocker les données
    this.userAccounts.set(user.clientCode, newAccounts);
    this.userTransactions.set(user.clientCode, newTransactions);

    console.log(`DemoDataService: New user created with ${newAccounts.length} accounts`, newAccounts);

    // Définir comme utilisateur courant
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

    // Pour les nouveaux utilisateurs, utiliser 250€ comme solde initial
    if (currentUser.clientCode !== '12345678') {
      initialCheckingBalance = 250;
      initialSavingsBalance = 250;
    }

    // Générer un numéro IBAN basé sur le code client
    const generateIBAN = (clientCode: string, suffix: string): string => {
      return `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} ${suffix}`;
    };

    // Recréer les comptes
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

    // Réinitialiser les transactions
    const resetTransactions: Transaction[] = [];

    // Mettre à jour
    this.userAccounts.set(currentUser.clientCode, resetAccounts);
    this.userTransactions.set(currentUser.clientCode, resetTransactions);

    // Notifier
    this.accountsSubject.next(resetAccounts);
    this.transactionsSubject.next(resetTransactions);

    console.log('DemoDataService: User data has been reset');

    // Sauvegarder dans le localStorage
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

    // Réinitialiser l'utilisateur par défaut
    this.initDefaultUser();
  }

  /**
   * Obtient les comptes d'un utilisateur spécifique
   * @private
   */
  private getUserAccounts(clientCode: string): Account[] {
    return this.userAccounts.get(clientCode) || [];
  }

  /**
   * Obtient les transactions d'un utilisateur spécifique
   * @private
   */
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
