import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { NumericKeypadComponent } from '../../components/numeric-keypad/numeric-keypad.component';
import { DigitsOnlyDirective } from '../../../../shared/directives/digits-only.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NumericKeypadComponent,
    DigitsOnlyDirective
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  passwordVisible = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      clientCode: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{8}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$')
      ]]
    });
  }

  ngOnInit(): void {
    // Si déjà connecté, rediriger vers la page d'accueil
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { clientCode, password } = this.loginForm.value;

    this.authService.login(clientCode, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  onPasswordChange(value: string): void {
    this.loginForm.patchValue({ password: value });
  }

  onPasswordComplete(value: string): void {
    // Si le code client est valide, soumettre automatiquement le formulaire
    if (this.loginForm.get('clientCode')?.valid) {
      this.onSubmit();
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  get clientCodeInvalid(): boolean {
    const control = this.loginForm.get('clientCode');
    return !!control && control.invalid && control.touched;
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.get('password');
    return !!control && control.invalid && control.touched;
  }

  resetPassword() {

  }
}
