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

  public currentValue = '';
  public keys: (number | string)[][] = [];

  ngOnInit(): void {
    // Générer les touches avec un ordre mélangé mais prévisible (seeded random pour démo)
    // Dans une vraie application bancaire, vous voudriez un mélange réellement aléatoire pour la sécurité
    this.generateKeys();
  }

  private generateKeys(): void {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, ''];
    this.shuffleArray(numbers);

    // Réorganiser en grille 3x4
    this.keys = [
      numbers.slice(0, 3),
      numbers.slice(3, 6),
      numbers.slice(6, 9),
      numbers.slice(9, 12)
    ];
  }

  private shuffleArray(array: any[]): void {
    // Note: Pour une application bancaire réelle, utilisez une méthode plus aléatoire
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  onKeyPress(key: number | string): void {
    if (typeof key !== 'number') return;

    if (this.currentValue.length < this.maxLength) {
      this.currentValue += key.toString();
      this.valueChange.emit(this.currentValue);

      if (this.currentValue.length === this.maxLength) {
        this.complete.emit(this.currentValue);
      }
    }
  }

  onClear(): void {
    this.currentValue = '';
    this.valueChange.emit(this.currentValue);
  }

  onDelete(): void {
    if (this.currentValue.length > 0) {
      this.currentValue = this.currentValue.slice(0, -1);
      this.valueChange.emit(this.currentValue);
    }
  }
}
