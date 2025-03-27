import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Vérifier si la requête est destinée à l'API
    if (request.url.includes('/api')) {
      // Récupérer le token depuis le service d'authentification
      const token = this.authService.getToken();

      // Si un token existe, le rajouter aux en-têtes de la requête
      if (token && token !== 'undefined' && token !== 'null') {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }

    // Continuer avec la requête modifiée et gérer les erreurs
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si erreur 401 (non autorisé), déconnecter l'utilisateur et rediriger vers login
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }

        // Propager l'erreur
        return throwError(() => error);
      })
    );
  }
}
