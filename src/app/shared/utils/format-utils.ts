/**
 * Formate un numéro de compte sous forme d'UUID en format plus lisible
 * @param accountNumber - L'UUID/ID à formater comme numéro de compte
 * @returns Le numéro formaté
 */
export function formatAccountNumber(accountNumber: string | undefined): string {
  if (!accountNumber) {
    return 'Non disponible';
  }

  // Si c'est un UUID classique (avec des tirets)
  if (accountNumber.includes('-')) {
    const parts = accountNumber.split('-');
    if (parts.length > 0) {
      return `${parts[0]}...${parts[parts.length - 1]}`;
    }
  }

  // Si ce n'est pas un UUID, mais que c'est assez long
  if (accountNumber.length > 12) {
    return `${accountNumber.substring(0, 8)}...${accountNumber.substring(accountNumber.length - 4)}`;
  }


  return accountNumber;
}
