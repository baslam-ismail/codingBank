export interface TransactionAccount {
  id: string;
  owner?: {
    name: string;
  };
}

// Structure de transaction reçue de l'API
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  // La date peut apparaître sous différents noms
  createdAt?: string;
  emittedAt?: string;
  updatedAt?: string;

  // Soit la structure imbriquée (format 1)
  emitter?: TransactionAccount;
  receiver?: TransactionAccount;

  // Soit la structure plate (format 2 - pour compatibilité)
  emitterAccountId?: string;
  receiverAccountId?: string;

  // Autres champs possibles
  status?: string;
}

// Demande de création de transaction
export interface CreateTransactionRequest {
  emitterAccountId: string;
  receiverAccountId: string;
  amount: number;
  description: string;
}

// Réponse après création d'une transaction
export interface TransactionResponse {
  id: string;
  amount: number;
  description: string;
  emittedAt?: string;
  createdAt?: string;
  updatedAt?: string;


  emitter?: TransactionAccount;
  receiver?: TransactionAccount;
  emitterAccountId?: string;
  receiverAccountId?: string;

  status?: string;
}
