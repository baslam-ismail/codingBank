// src/app/core/authentication/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DemoDataService } from '../services/demo-data.service';
import { User } from '../../models/user.model';
import {Account} from '../../models/account.model';

interface RegisterRequest {
  name: string;
  password: string;
}

interface LoginResponse {
  jwt: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'current_user';
  private apiUrl = environment.apiUrl;

  private http = inject(HttpClient);
  private router = inject(Router);
  private demoDataService = inject(DemoDataService);

  private clearPreviousUserData(): void {
    // Supprimer complètement les anciennes données
    localStorage.removeItem('demo_user_accounts');
    localStorage.removeItem('demo_user_transactions');
    localStorage.removeItem('demo_current_user');

    // Vider les objets en mémoire également
    localStorage.setItem('demo_user_accounts', '{}');
    localStorage.setItem('demo_user_transactions', '{}');

    console.log('AuthService: All previous user data cleared');
  }

  constructor() {
    // Charger l'utilisateur depuis le localStorage au démarrage
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUser = localStorage.getItem(this.USER_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);

          // IMPORTANT: Ne pas définir l'utilisateur dans DemoDataService ici
          // car DemoDataService se charge déjà de restaurer ses données
          // depuis le localStorage
        }
      }
    } catch (e) {
      console.error('Error loading stored user', e);
    }
  }

  login(clientCode: string, password: string): Observable<any> {
    // Si en mode démo, simuler un login
    if (environment.demo) {
      return this.loginDemo(clientCode, password);
    }

    // Sinon, requête au backend
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { clientCode, password })
      .pipe(
        tap(response => {
          this.storeUserData(response);
        }),
        catchError(error => {
          console.error('Login failed', error);
          return throwError(() => new Error('Identifiants invalides. Veuillez réessayer.'));
        })
      );
  }

  private loginDemo(clientCode: string, password: string): Observable<any> {
    // Pour la démo, accepter simplement un couple clientCode/password prédéfini
    const validCredentials = [
      { clientCode: '12345678', password: '123456', name: 'Utilisateur Démo' }
    ];

    // Vérifier si les identifiants correspondent à un utilisateur existant
    const matchedUser = validCredentials.find(
      cred => cred.clientCode === clientCode && cred.password === password
    );

    if (matchedUser) {
      const loginResponse: LoginResponse = {
        jwt: 'demo-token-' + Date.now(),
        user: {
          clientCode: matchedUser.clientCode,
          name: matchedUser.name
        }
      };

      return of(loginResponse).pipe(
        delay(800), // Simuler un délai réseau
        tap(response => {
          this.storeUserData(response);
          // Définir l'utilisateur dans le DemoDataService
          this.demoDataService.setCurrentUser(response.user);
        })
      );
    } else {
      // Vérifier si c'est un utilisateur créé précédemment
      // Cette partie est simplifiée car nous n'avons pas de véritable base de données utilisateur
      // En production, vous feriez une vraie vérification d'authentification

      if (clientCode.length === 8 && password === '123456') {
        // Créer une réponse pour un utilisateur existant non prédéfini
        const loginResponse: LoginResponse = {
          jwt: 'demo-token-' + Date.now(),
          user: {
            clientCode: clientCode,
            name: 'Utilisateur ' + clientCode.substring(0, 4) // Nom générique
          }
        };

        return of(loginResponse).pipe(
          delay(800), // Simuler un délai réseau
          tap(response => {
            this.storeUserData(response);
            // Définir l'utilisateur dans le DemoDataService
            // Cela va charger ses données existantes du localStorage
            this.demoDataService.setCurrentUser(response.user);
          })
        );
      }

      return throwError(() => new Error('Identifiants invalides. Pour la démo, utilisez le mot de passe 123456.'));
    }
  }

  register(name: string, password: string): Observable<any> {
    const registerData: RegisterRequest = { name, password };

    // Si en mode démo, simuler une inscription
    if (environment.demo) {
      return this.registerDemo(name, password);
    }

    // URL corrigée pour l'inscription
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, registerData)
      .pipe(
        tap(response => {
          this.storeUserData(response);
        }),
        catchError(error => {
          console.error('Registration failed', error);
          return throwError(() => new Error('L\'inscription a échoué. Veuillez réessayer.'));
        })
      );
  }

  private registerDemo(name: string, password: string): Observable<any> {
    // Validation de base
    if (name.length < 3) {
      return throwError(() => new Error('Le nom doit contenir au moins 3 caractères.'));
    }

    if (password.length !== 6 || !/^\d+$/.test(password)) {
      return throwError(() => new Error('Le mot de passe doit contenir exactement 6 chiffres.'));
    }

    this.clearPreviousUserData();

    // Générer un code client unique
    const clientCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Créer le nouvel utilisateur
    const newUser: User = {
      clientCode: clientCode,
      name: name
    };

    // Créer la réponse de login
    const demoResponse: LoginResponse = {
      jwt: 'demo-token-' + Math.random().toString(36).substring(2, 10),
      user: newUser
    };

    // IMPORTANT: Créer de nouveaux comptes pour l'utilisateur
    const newAccounts: Account[] = [
      {
        id: 'acc-checking-' + clientCode,
        label: 'Compte Courant',
        balance: 250.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: clientCode,
        accountNumber: `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} 0000 0000 0000 000`,
        type: 'CHECKING',
        currency: 'EUR'
      },
      {
        id: 'acc-savings-' + clientCode,
        label: 'Livret Épargne',
        balance: 250.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: clientCode,
        accountNumber: `FR76 ${clientCode.substring(0, 4)} ${clientCode.substring(4, 8)} 1111 1111 1111 111`,
        type: 'SAVINGS',
        currency: 'EUR'
      }
    ];

    // Créer les structures de stockage dans le localStorage
    // Récupérer et mettre à jour les comptes
    let allAccounts = [];
    try {
      const stored = localStorage.getItem('demo_user_accounts');
      if (stored) {
        allAccounts = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing accounts', e);
    }

    // Ajouter les nouveaux comptes
    allAccounts[clientCode] = newAccounts;

    // Initialiser les transactions
    let allTransactions = [];
    try {
      const stored = localStorage.getItem('demo_user_transactions');
      if (stored) {
        allTransactions = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing transactions', e);
    }

    // Ajouter un tableau vide pour les transactions
    allTransactions[clientCode] = [];

    // Sauvegarder dans localStorage
    localStorage.setItem('demo_user_accounts', JSON.stringify(allAccounts));
    localStorage.setItem('demo_user_transactions', JSON.stringify(allTransactions));
    localStorage.setItem('demo_current_user', JSON.stringify(newUser));
    localStorage.setItem(this.TOKEN_KEY, demoResponse.jwt);
    localStorage.setItem(this.USER_KEY, JSON.stringify(newUser));

    return of(demoResponse).pipe(
      delay(1000), // Simuler un délai réseau
      tap(response => {
        this.currentUserSubject.next(newUser);

        // Forcer un rafraîchissement complet de la page
        // C'est la solution la plus simple et la plus fiable
        window.location.href = '/home';
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Garder les données démo dans localStorage pour la persistance
      // mais supprimer les tokens d'authentification
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }



  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    try {
      // Vérifier si on est dans un navigateur
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token || token === 'undefined' || token === 'null') {
          return null;
        }
        return token;
      }
      // Si on n'est pas dans un navigateur (SSR)
      return null;
    } catch (e) {
      console.error('Error accessing token', e);
      return null;
    }
  }

  private storeUserData(response: LoginResponse): void {
    if (response && response.jwt) {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.TOKEN_KEY, response.jwt);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      }
      this.currentUserSubject.next(response.user);
    }
  }
}
