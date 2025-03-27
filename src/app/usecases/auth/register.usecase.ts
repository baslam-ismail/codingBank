import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, delay, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/authentication/auth.service';
import { AuthStore } from '../../store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterUseCase {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);

  execute(name: string, password: string): Observable<any> {
    this.authStore.setLoading(true);

    // En mode démo, simuler l'inscription
    if (environment.demo) {
      return this.registerDemo(name, password);
    }

    return this.authService.register(name, password).pipe(
      tap({
        next: (response) => {
          if (response && response.user) {
            this.authStore.setUser(response.user);
          }
          this.authStore.setLoading(false);
          this.authStore.setError(null);
        },
        error: (error) => {
          this.authStore.setLoading(false);
          this.authStore.setError(error.message || 'Erreur lors de l\'inscription');
          console.error('Register error:', error);
        }
      })
    );
  }

  private registerDemo(name: string, password: string): Observable<any> {
    // Validation de base
    if (!name || name.length < 3) {
      return throwError(() => new Error('Le nom doit contenir au moins 3 caractères'));
    }

    if (!password || password.length !== 6 || !/^\d+$/.test(password)) {
      return throwError(() => new Error('Le mot de passe doit contenir exactement 6 chiffres'));
    }

    // Générer un code client pour la démo
    const clientCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Simuler une réponse d'API
    return of({
      jwt: 'demo-token-' + Math.random().toString(36).substring(2, 15),
      user: {
        clientCode: clientCode,
        name: name
      }
    }).pipe(
      delay(1000), // Simuler un délai réseau
      tap(response => {
        this.authStore.setUser(response.user);
        this.authStore.setLoading(false);
        this.authStore.setError(null);
        localStorage.setItem('jwt_token', response.jwt);
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }),
      catchError(error => {
        this.authStore.setLoading(false);
        this.authStore.setError(error.message);
        return throwError(() => error);
      })
    );
  }
}
