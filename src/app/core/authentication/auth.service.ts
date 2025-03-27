// src/app/core/authentication/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface RegisterRequest {
  name: string;
  password: string;
}

interface LoginResponse {
  jwt: string;
  user: {
    clientCode: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'current_user';
  private apiUrl = environment.apiUrl;

  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    // Charger l'utilisateur depuis le localStorage au démarrage
    this.loadStoredUser();
  }

  // private loadStoredUser(): void {
  //   try {
  //     const storedUser = localStorage.getItem(this.USER_KEY);
  //     if (storedUser) {
  //       this.currentUserSubject.next(JSON.parse(storedUser));
  //     }
  //   } catch (e) {
  //     console.error('Error loading stored user', e);
  //   }
  // }

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
    if (clientCode === '12345678' && password === '123456') {
      const demoResponse: LoginResponse = {
        jwt: 'demo-token-xyz',
        user: {
          clientCode: clientCode,
          name: 'Utilisateur Démo'
        }
      };

      return of(demoResponse).pipe(
        delay(800), // Simuler un délai réseau
        tap(response => {
          this.storeUserData(response);
        })
      );
    } else {
      return throwError(() => new Error('Identifiants invalides. Pour la démo, utilisez: 12345678 / 123456'));
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

    const clientCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    const demoResponse: LoginResponse = {
      jwt: 'demo-token-' + Math.random().toString(36).substring(2, 10),
      user: {
        clientCode: clientCode,
        name: name
      }
    };

    return of(demoResponse).pipe(
      delay(1000), // Simuler un délai réseau
      tap(response => {
        this.storeUserData(response);
      })
    );
  }

  // logout(): void {
  //   localStorage.removeItem(this.TOKEN_KEY);
  //   localStorage.removeItem(this.USER_KEY);
  //   this.currentUserSubject.next(null);
  //   this.router.navigate(['/auth/login']);
  // }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // getToken(): string | null {
  //   try {
  //     if (typeof window !== 'undefined' && window.localStorage) {
  //       const token = localStorage.getItem(this.TOKEN_KEY);
  //       if (!token || token === 'undefined' || token === 'null') {
  //         return null;
  //       }
  //       return token;
  //     } else {
  //       console.warn('localStorage is not available (server-side or Vite context)');
  //       return null;
  //     }
  //   } catch (e) {
  //     console.error('Error accessing token', e);
  //     return null;
  //   }
  // }

  // private storeUserData(response: LoginResponse): void {
  //   if (response && response.jwt) {
  //     localStorage.setItem(this.TOKEN_KEY, response.jwt);
  //     localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  //     this.currentUserSubject.next(response.user);
  //   }
  // }

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

// De même, modifiez la méthode loadStoredUser
  private loadStoredUser(): void {
    try {
      // Vérifier si on est dans un navigateur
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUser = localStorage.getItem(this.USER_KEY);
        if (storedUser) {
          this.currentUserSubject.next(JSON.parse(storedUser));
        }
      }
    } catch (e) {
      console.error('Error loading stored user', e);
    }
  }

// Et tout autre méthode qui utilise localStorage
  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
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
