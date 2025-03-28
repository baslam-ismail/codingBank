
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataUpdateService {
  private accountsUpdated = new Subject<void>();
  public accountsUpdated$ = this.accountsUpdated.asObservable();


  private transactionsUpdated = new Subject<string>();
  public transactionsUpdated$ = this.transactionsUpdated.asObservable();


  notifyAccountsUpdated(): void {
    console.log('DataUpdateService: Notifying accounts updated');
    this.accountsUpdated.next();
  }


  notifyTransactionsUpdated(accountId: string): void {
    console.log(`DataUpdateService: Notifying transactions updated for account ${accountId}`);
    this.transactionsUpdated.next(accountId);
  }
}
