import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterUseCase } from '../../../../usecases/auth/register.usecase';
import { NumericKeypadComponent } from '../../components/numeric-keypad/numeric-keypad.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NumericKeypadComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  passwordVisible = false;
  isDemoMode = environment.demo;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private registerUseCase = inject(RegisterUseCase);

  constructor() {
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

    // Pré-remplir avec un nom pour la démo
    if (this.isDemoMode) {
      this.registerForm.patchValue({
        name: 'Utilisateur Test'
      });
    }
  }

  ngOnInit(): void {
    // Redirection si déjà connecté
    if (localStorage.getItem('jwt_token')) {
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

    this.registerUseCase.execute(name, password).subscribe({
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

  resetPassword(): void {
    this.registerForm.patchValue({ password: '' });
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
    return !!control && control.invalid && control.touched;
  }
}
