export interface Account {
  id: string;
  label: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  accountNumber?: string;
  type?: 'CHECKING' | 'SAVINGS' | 'TERM_DEPOSIT';
  currency?: string; // Par défaut EUR
}
