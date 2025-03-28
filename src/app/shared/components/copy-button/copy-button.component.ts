import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="copyValue()"
      class="inline-flex items-center justify-center p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      [ngClass]="{'text-green-500 bg-green-50': copied}"
      [title]="buttonTitle"
    >
      <span class="sr-only">{{ buttonTitle }}</span>
      <!-- Icône copier -->
      <svg *ngIf="!copied" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
      <!-- Icône succès -->
      <svg *ngIf="copied" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  `,
  styles: [`
    button {
      transition: all 0.2s ease-in-out;
    }

    button:active {
      transform: scale(0.95);
    }
  `]
})
export class CopyButtonComponent {
  @Input() value: string = '';
  @Input() label: string = 'Copier';
  @Input() showToast: boolean = true;

  private clipboardService = inject(ClipboardService);

  copied = false;

  get buttonTitle(): string {
    return this.copied ? 'Copié !' : `${this.label}`;
  }

  async copyValue(): Promise<void> {
    if (!this.value) return;

    const success = await this.clipboardService.copyToClipboard(
      this.value,
      `${this.label} copié !`
    );

    if (success) {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }
  }
}
