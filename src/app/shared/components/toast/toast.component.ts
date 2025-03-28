import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="visible"
      class="fixed bottom-4 right-4 z-50 flex items-center p-4 space-x-4 w-full max-w-xs text-gray-500 bg-white rounded-lg shadow-lg border border-gray-100 transition transform duration-300"
      [ngClass]="{'translate-y-0 opacity-100': visible, 'translate-y-16 opacity-0': !visible}"
    >
      <div class="inline-flex flex-shrink-0 justify-center items-center w-8 h-8 text-green-500 bg-green-100 rounded-lg">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <div class="text-sm font-normal">{{ message }}</div>
      <button
        type="button"
        class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
        (click)="hideToast()"
      >
        <span class="sr-only">Fermer</span>
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    div {
      animation: slideIn 0.3s ease-out forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() duration: number = 3000; // Durée d'affichage par défaut en ms

  message: string = '';
  visible: boolean = false;

  private subscription = new Subscription();
  private timer: any;
  private clipboardService = inject(ClipboardService);

  ngOnInit(): void {
    this.subscription.add(
      this.clipboardService.message$.subscribe(message => {
        if (message) {
          this.showToast(message);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  showToast(message: string): void {
    this.message = message;
    this.visible = true;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.hideToast();
    }, this.duration);
  }

  hideToast(): void {
    this.visible = false;
  }
}
