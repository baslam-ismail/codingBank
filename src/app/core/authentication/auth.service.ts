import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
    // Ne pas charger automatiquement l'utilisateur au démarrage
  }

  login(clientCode: string, password: string): Observable<any> {
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

  register(name: string, password: string): Observable<any> {
    const registerData: RegisterRequest = { name, password };

    // URL corrigée pour l'inscription - sans le préfixe '/auth'
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

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (!token || token === 'undefined' || token === 'null') {
          return null;
        }
        return token;
      } else {
        console.warn('localStorage is not available (server-side or Vite context)');
        return null;
      }
    } catch (e) {
      console.error('Error accessing token', e);
      return null;
    }
  }


  private storeUserData(response: LoginResponse): void {
    if (response && response.jwt) {
      localStorage.setItem(this.TOKEN_KEY, response.jwt);
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
  }
}
