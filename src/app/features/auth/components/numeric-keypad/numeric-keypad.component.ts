import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-numeric-keypad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numeric-keypad.component.html',
  styleUrls: ['./numeric-keypad.component.scss']
})
export class NumericKeypadComponent implements OnInit {
  @Input() maxLength = 6;
  @Output() valueChange = new EventEmitter<string>();
  @Output() complete = new EventEmitter<string>();

  currentValue = '';
  keys: (string | number)[][] = [];

  ngOnInit(): void {
    this.generateRandomKeys();
  }

  private generateRandomKeys(): void {
    // Créer un array de 0-9
    const digits = Array.from({ length: 10 }, (_, i) => i);

    // Ajouter 'X' pour effacer
    const allKeys = [...digits, 'X'];

    // Mélanger l'array
    this.shuffleArray(allKeys);

    // Ajouter deux emplacements vides aléatoirement
    for (let i = 0; i < 2; i++) {
      const randomPosition = Math.floor(Math.random() * (allKeys.length + 1));
      allKeys.splice(randomPosition, 0, '');
    }

    // Diviser en rangées de 3
    this.keys = [];
    for (let i = 0; i < allKeys.length; i += 3) {
      this.keys.push(allKeys.slice(i, i + 3));
    }
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  resetKeypad(): void {
    this.currentValue = '';
    this.generateRandomKeys();
  }




  onKeyPress(key: string | number): void {
    if (key === 'X') {
      // Effacer le dernier chiffre
      if (this.currentValue.length > 0) {
        this.currentValue = this.currentValue.slice(0, -1);
        this.valueChange.emit(this.currentValue);
      }
      return;
    }

    if (typeof key === 'number' && this.currentValue.length < this.maxLength) {
      this.currentValue += key.toString();
      this.valueChange.emit(this.currentValue);

      // Si longueur maximale atteinte, émettre l'événement complet
      if (this.currentValue.length === this.maxLength) {
        this.complete.emit(this.currentValue);
      }
    }
  }
}
