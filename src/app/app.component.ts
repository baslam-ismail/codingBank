import { Component, inject } from '@angular/core';
import {Router, NavigationEnd, RouterLink, RouterOutlet, RouterLinkActive} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/authentication/auth.service';
import { LogoutButtonComponent } from './shared/components/logout-button/logout-button.component';
import { environment } from '../environments/environment';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    LogoutButtonComponent,
    RouterLinkActive
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'CodingBank';
  showHeader = false;
  isDemoMode = environment.demo;
  currentUser: User | null = null;

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    // Observer les changements de route pour décider quand afficher l'en-tête
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Afficher l'en-tête seulement si l'utilisateur est sur une page qui n'est pas d'authentification
      this.showHeader = !event.url.includes('/auth/');
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
  }
}
