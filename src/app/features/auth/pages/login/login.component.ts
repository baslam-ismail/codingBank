import {Component, OnInit, inject, Inject, PLATFORM_ID} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginUseCase } from '../../../../usecases';
import { NumericKeypadComponent } from '../../components/numeric-keypad/numeric-keypad.component';
import { DigitsOnlyDirective } from '../../../../shared/directives/digits-only.directive';
import { environment } from '../../../../../environments/environment';

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
  isDemoMode = environment.demo;
  private numericKeypadComponent: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginUseCase: LoginUseCase,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Déplacer l'initialisation du formulaire ici
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

    // Pré-remplir uniquement côté client
    if (isPlatformBrowser(this.platformId) && this.isDemoMode) {
      this.loginForm.patchValue({
        clientCode: '12345678'
      });
    }
  }

  ngOnInit(): void {
    // Vérifier si on est dans le navigateur avant d'accéder à localStorage
    if (isPlatformBrowser(this.platformId)) {
      // Redirection si déjà connecté
      if (localStorage.getItem('jwt_token')) {
        this.router.navigate(['/home']);
      }
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

    this.loginUseCase.execute(clientCode, password).subscribe({
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

  resetPasswordInput(): void {
    this.loginForm.patchValue({ password: '' });
    this.numericKeypadComponent.resetKeypad();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  resetPassword(): void {
    this.loginForm.patchValue({ password: '' });
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
}
