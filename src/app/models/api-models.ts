// src/app/models/api-models.ts
// Interfaces TypeScript basées sur les schémas d'API fournis

/**
 * Interface pour l'inscription (RegisterDTO)
 */
export interface RegisterDTO {
  name: string;      // Nom complet de l'utilisateur
  password: string;  // Mot de passe (6 chiffres pour ce système)
}

/**
 * Interface pour la connexion (LoginDTO)
 */
export interface LoginDTO {
  clientCode: string;  // Code client (8 chiffres)
  password: string;    // Mot de passe (6 chiffres)
}

/**
 * Interface pour l'ouverture d'un compte (OpenAccountDTO)
 */
export interface OpenAccountDTO {
  initialBalance: number;  // Solde initial (ex: 100)
  label: string;           // Libellé du compte (ex: "Compte courant")
}

/**
 * Interface pour l'émission d'une transaction (EmitTransactionDTO)
 */
export interface EmitTransactionDTO {
  emitterAccountId: string;   // UUID du compte émetteur (ex: "7847e121-a0e8-421e-a915-c0e1c30de188")
  receiverAccountId: string;  // UUID du compte destinataire (ex: "e7e51e00-b18e-4391-81ca-77cfb196970d")
  amount: number;             // Montant de la transaction (ex: 50)
  description: string;        // Description (ex: "Refund")
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
  // Nettoyer la chaîne des espaces
  const cleanInput = input.replace(/\s+/g, '');
  // Format basique d'un IBAN français (ne vérifie pas la validité mathématique)
  const ibanPattern = /^FR\d{2}\d{10}[A-Z0-9]{11}\d{2}$/i;
  return ibanPattern.test(cleanInput);
}
