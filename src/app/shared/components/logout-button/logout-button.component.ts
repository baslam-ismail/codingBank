import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogoutUseCase } from '../../../usecases';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="logout()"
      class="px-4 py-2 flex items-center space-x-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm7 9a1 1 0 10-2 0v2a1 1 0 102 0v-2zm-1-7a1 1 0 011 1v4a1 1 0 11-2 0V6a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      <span>Déconnexion</span>
    </button>
  `,
  styles: [`
    button {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    button:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    button:active {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class LogoutButtonComponent {
  private logoutUseCase = inject(LogoutUseCase);

  logout(): void {
    this.logoutUseCase.execute();
  }
}
