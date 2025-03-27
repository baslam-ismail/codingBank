// Modifications pour src/app/features/auth/components/numeric-keypad/numeric-keypad.component.ts
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
    this.generateKeys();
  }

  private generateKeys(): void {
    // Arrange digits 0-9 and actions
    this.keys = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['', 0, 'X']
    ];
  }

  onKeyPress(key: string | number): void {
    if (key === 'X') {
      // Delete last digit
      if (this.currentValue.length > 0) {
        this.currentValue = this.currentValue.slice(0, -1);
        this.valueChange.emit(this.currentValue);
      }
      return;
    }

    if (typeof key === 'number' && this.currentValue.length < this.maxLength) {
      this.currentValue += key.toString();
      this.valueChange.emit(this.currentValue);

      // If we've reached maxLength, emit complete event
      if (this.currentValue.length === this.maxLength) {
        this.complete.emit(this.currentValue);
      }
    }
  }
}
