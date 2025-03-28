import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600"
      [ngClass]="sizeClasses"
    >
      <span class="font-semibold text-white" [ngClass]="textSizeClass">
        {{ initials }}
      </span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class UserAvatarComponent {
  @Input() name: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get initials(): string {
    if (!this.name) return '?';

    return this.name.split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  get sizeClasses(): string {
    switch(this.size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      case 'xl': return 'w-16 h-16';
      case 'md':
      default: return 'w-10 h-10';
    }
  }

  get textSizeClass(): string {
    switch(this.size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case 'md':
      default: return 'text-sm';
    }
  }
}

