import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DigitsOnlyDirective } from './directives/digits-only.directive';

@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DigitsOnlyDirective
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DigitsOnlyDirective
  ]
})
export class SharedModule { }
