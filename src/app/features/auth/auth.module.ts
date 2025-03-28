import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { NumericKeypadComponent } from './components/numeric-keypad/numeric-keypad.component';
import { AuthRoutingModule } from './auth-routing.module';

@NgModule({
  declarations: [

  ],
  exports: [
    NumericKeypadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthRoutingModule,
    LoginComponent,
    RegisterComponent,
    NumericKeypadComponent
  ]
})
export class AuthModule { }
