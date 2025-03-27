// src/app/shared/directives/digits-only.directive.ts
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDigitsOnly]',
  standalone: true
})
export class DigitsOnlyDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    const sanitized = value.replace(/[^0-9]/g, '');

    if (value !== sanitized) {
      input.value = sanitized;
      // Créer un événement d'input personnalisé pour déclencher la mise à jour du formulaire
      const customEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(customEvent);
    }
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    event.preventDefault();

    if (event.clipboardData) {
      const pastedText = event.clipboardData.getData('text/plain');
      const sanitized = pastedText.replace(/[^0-9]/g, '');

      document.execCommand('insertText', false, sanitized);
    }
  }
}
