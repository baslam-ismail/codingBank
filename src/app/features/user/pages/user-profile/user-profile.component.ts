import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { AuthStore } from '../../../../store';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UserAvatarComponent,
    CopyButtonComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <!-- Retour -->
        <div class="mb-6">
          <a routerLink="/home" class="text-indigo-600 hover:text-indigo-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </a>
        </div>

        <!-- Titre -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p class="mt-1 text-sm text-gray-500">Consultez et gérez vos informations personnelles</p>
        </div>

        <!-- Carte profil -->
        <div class="bg-white shadow-md rounded-lg overflow-hidden">
          <div class="p-6 sm:p-8">
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <app-user-avatar
                  [name]="user?.name || ''"
                  size="xl"
                ></app-user-avatar>
              </div>

              <!-- Informations -->
              <div class="flex-1 text-center sm:text-left">
                <h2 class="text-xl font-bold text-gray-900">{{ user?.name || 'Utilisateur' }}</h2>

                <!-- Code client avec bouton copier -->
                <div class="mt-2 flex items-center justify-center sm:justify-start">
                  <div class="px-3 py-1.5 bg-gray-100 rounded-lg flex items-center">
                    <span class="text-sm font-medium text-gray-800 mr-2">Code client: {{ user?.clientCode || '-' }}</span>
                    <app-copy-button
                      [value]="user?.clientCode || ''"
                      label="Code client"
                    ></app-copy-button>
                  </div>
                </div>

                <!-- Informations supplémentaires -->
                <div class="mt-4 text-sm text-gray-500">
                  <p>Connexion en cours sur l'application bancaire.</p>
                  <p class="mt-1">En cas de problème, contactez notre service client.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions utilisateur -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white rounded-md transition-colors"
              >
                Modifier mon profil
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-white hover:bg-gray-50 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-gray-700 border border-gray-300 rounded-md transition-colors"
                routerLink="/auth/change-password"
              >
                Changer mon mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;

  private authStore = inject(AuthStore);

  ngOnInit(): void {
    this.authStore.selectUser().subscribe(user => {
      this.user = user;
    });
  }
}
