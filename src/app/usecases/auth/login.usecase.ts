import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, delay, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/authentication/auth.service';
import { AuthStore } from '../../store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginUseCase {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);

  execute(clientCode: string, password: string): Observable<any> {
    this.authStore.setLoading(true);

    // En mode démo, nous utilisons des identifiants prédéfinis
    if (environment.demo) {
      return this.loginDemo(clientCode, password);
    }

    // Sinon, on utilise le service réel
    return this.authService.login(clientCode, password).pipe(
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
          this.authStore.setError(error.message || 'Erreur lors de la connexion');
          console.error('Login error:', error);
        }
      })
    );
  }

  private loginDemo(clientCode: string, password: string): Observable<any> {
    // Simuler un délai réseau
    return of({
      jwt: 'demo-token-12345',
      user: {
        clientCode: clientCode,
        name: 'Utilisateur Démo'
      }
    }).pipe(
      delay(800), // Simuler un délai de réseau
      tap(response => {
        if (clientCode === '12345678' && password === '123456') {
          // Identifiants valides pour la démo
          this.authStore.setUser(response.user);
          this.authStore.setLoading(false);
          this.authStore.setError(null);
          localStorage.setItem('jwt_token', response.jwt);
          localStorage.setItem('current_user', JSON.stringify(response.user));
        } else {
          // Simuler une erreur d'authentification
          throw new Error('Identifiants invalides. Pour la démo, utilisez: 12345678 / 123456');
        }
      }),
      catchError(error => {
        this.authStore.setLoading(false);
        this.authStore.setError(error.message);
        return throwError(() => error);
      })
    );
  }
}
