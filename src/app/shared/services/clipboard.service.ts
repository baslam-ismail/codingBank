import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { take, map  } from 'rxjs/operators';

interface ClipboardState {
  lastCopied: string | null;
  isCopied: boolean;
  message: string | null;
}

const initialState: ClipboardState = {
  lastCopied: null,
  isCopied: false,
  message: null
};

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private state = new BehaviorSubject<ClipboardState>(initialState);

  // Sélecteurs
  readonly isCopied$: Observable<boolean> = this.state.asObservable().pipe(
    map(state => state.isCopied)
  );

  readonly message$: Observable<string | null> = this.state.asObservable().pipe(
    map(state => state.message)
  );

  /**
   * Copie le texte dans le presse-papier et met à jour l'état
   * @param text - Texte à copier
   * @param message - Message de confirmation (facultatif)
   */
  async copyToClipboard(text: string, message: string = 'Copié!'): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);

      // Mettre à jour l'état
      this.state.next({
        lastCopied: text,
        isCopied: true,
        message: message
      });

      // Réinitialiser après 2 secondes
      timer(2000).pipe(take(1)).subscribe(() => {
        this.state.next({
          ...this.state.getValue(),
          isCopied: false,
          message: null
        });
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la copie:', error);

      this.state.next({
        ...this.state.getValue(),
        isCopied: false,
        message: 'Erreur lors de la copie'
      });

      return false;
    }
  }

  /**
   * Vérifie si la fonctionnalité presse-papier est disponible
   */
  isClipboardAvailable(): boolean {
    return !!navigator.clipboard;
  }
}
