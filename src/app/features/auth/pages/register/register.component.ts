import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import {NumericKeypadComponent} from '../../components/numeric-keypad/numeric-keypad.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [
    ReactiveFormsModule,
    NumericKeypadComponent,
    CommonModule
  ],
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  passwordVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
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
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { name, password } = this.registerForm.value;

    this.authService.register(name, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Rediriger vers la page d'accueil après inscription réussie
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }

  onPasswordChange(value: string): void {
    this.registerForm.patchValue({ password: value });
  }

  onPasswordComplete(value: string): void {
    // Si le nom est valide, soumettre automatiquement le formulaire
    if (this.registerForm.get('name')?.valid) {
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

  get nameInvalid(): boolean {
    const control = this.registerForm.get('name');
    return !!control && control.invalid && control.touched;
  }

  get passwordInvalid(): boolean {
    const control = this.registerForm.get('password');
    return !!control && control.invalid && control.touched && control.dirty && control.value.length > 0;
  }

  resetPassword() {

  }
}
