// src/app/models/transaction.model.ts
// Modèles alignés sur les schémas d'API fournis

/**
 * Interface pour les transactions reçues de l'API
 */
export interface TransactionAccount {
  id: string;
  owner?: {
    name: string;
  };
}
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  // La date peut apparaître sous différents noms
  createdAt?: string;
  emittedAt?: string;
  updatedAt?: string;

  emitter?: TransactionAccount;
  receiver?: TransactionAccount;

  // Identifiants des comptes (format UUID)
  emitterAccountId: string;
  receiverAccountId: string;

  // Autres champs possibles
  status?: string;
}

/**
 * Interface pour l'émission d'une transaction (alignée avec EmitTransactionDTO)
 */
export interface CreateTransactionRequest {
  emitterAccountId: string;    // UUID du compte émetteur
  receiverAccountId: string;   // UUID du compte destinataire ou identifiant externe
  amount: number;              // Montant de la transaction
  description: string;         // Description de la transaction
}

/**
 * Interface pour la réponse après création d'une transaction
 */
export interface TransactionResponse {
  id: string;                // UUID de la transaction
  amount: number;            // Montant
  description: string;       // Description
  emittedAt?: string;        // Date d'émission
  createdAt?: string;        // Date de création
  updatedAt?: string;        // Date de mise à jour
  emitterAccountId: string;  // UUID du compte émetteur
  receiverAccountId: string; // UUID du compte destinataire
  status?: string;           // Statut de la transaction
}
