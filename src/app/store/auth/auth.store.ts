import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthState } from '../store.types';
import { User } from '../../models/user.model';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private state = new BehaviorSubject<AuthState>(initialState);

  // Sélecteurs
  get state$(): Observable<AuthState> {
    return this.state.asObservable();
  }

  selectUser(): Observable<User | null> {
    return this.state$.pipe(map(state => state.user));
  }

  selectIsAuthenticated(): Observable<boolean> {
    return this.state$.pipe(map(state => state.isAuthenticated));
  }

  selectLoading(): Observable<boolean> {
    return this.state$.pipe(map(state => state.loading));
  }

  selectError(): Observable<string | null> {
    return this.state$.pipe(map(state => state.error));
  }


  setUser(user: User | null): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      user,
      isAuthenticated: !!user
    });
  }

  setLoading(loading: boolean): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      loading
    });
  }

  setError(error: string | null): void {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      error
    });
  }

  resetState(): void {
    this.state.next(initialState);
  }
}


