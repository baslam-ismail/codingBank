import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../../core/authentication/auth.service';
import { AuthStore } from '../../store';

@Injectable({
  providedIn: 'root'
})
export class LoginUseCase {
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);

  execute(clientCode: string, password: string): Observable<any> {
    this.authStore.setLoading(true);

    return this.authService.login(clientCode, password).pipe(
      tap({
        next: (response) => {
          // Le service AuthService stocke déjà le token dans localStorage
          // Nous mettons à jour l'état du store
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
}
