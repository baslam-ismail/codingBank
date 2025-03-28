

/**
 * Interface pour l'inscription (RegisterDTO)
 */
export interface RegisterDTO {
  name: string;
  password: string;
}

/**
 * Interface pour la connexion (LoginDTO)
 */
export interface LoginDTO {
  clientCode: string;
  password: string;
}

/**
 * Interface pour l'ouverture d'un compte (OpenAccountDTO)
 */
export interface OpenAccountDTO {
  initialBalance: number;
  label: string;
}

/**
 * Interface pour l'émission d'une transaction (EmitTransactionDTO)
 */
export interface EmitTransactionDTO {
  emitterAccountId: string;
  receiverAccountId: string;
  amount: number;
  description: string;
}

/**
 * Utilitaire pour la validation d'UUID
 */
export function isUUID(input: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(input);
}

/**
 * Utilitaire pour la validation d'IBAN français
 */
export function isFrenchIBAN(input: string): boolean {
  const cleanInput = input.replace(/\s+/g, '');
  const ibanPattern = /^FR\d{2}\d{10}[A-Z0-9]{11}\d{2}$/i;
  return ibanPattern.test(cleanInput);
}
