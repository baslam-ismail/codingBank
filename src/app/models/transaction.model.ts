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
  createdAt?: string;
  emittedAt?: string;
  updatedAt?: string;
  emitter?: TransactionAccount;
  receiver?: TransactionAccount;
  emitterAccountId: string;
  receiverAccountId: string;
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

export interface DisplayTransaction extends Transaction {
  direction: 'incoming' | 'outgoing';
  displayAmount: number;
  displaySign: '+' | '-';
  formattedAmount: string;
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
export interface DisplayTransaction extends Transaction {
  partnerName?: string; // Nom du partenaire calculé
}


