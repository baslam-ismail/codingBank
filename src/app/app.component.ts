import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/authentication/auth.service';
import { LogoutButtonComponent } from './shared/components/logout-button/logout-button.component';
import { environment } from '../environments/environment';
import { User } from './models/user.model';
import { UserAvatarComponent } from './features/user/components/user-avatar/user-avatar.component';
import { CopyButtonComponent } from './shared/components/copy-button/copy-button.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthStore } from './store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LogoutButtonComponent,
    UserAvatarComponent,
    CopyButtonComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'CodingBank';
  showHeader = false;
  isDemoMode = environment.demo;
  currentUser: User | null = null;

  private router = inject(Router);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);

  ngOnInit() {
    // Observer les changements de route pour décider quand afficher l'en-tête
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Afficher l'en-tête seulement si l'utilisateur est sur une page qui n'est pas d'authentification
      this.showHeader = !event.url.includes('/auth/');
    });

    // S'abonner aux changements d'utilisateur
    this.authStore.selectUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
  }
}
