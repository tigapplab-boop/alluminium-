export type UserRole = 'ADMIN' | 'ASSOCIE'

export interface User {
  id: string
  username: string
  role: UserRole
  associeId?: string | null
  associe?: Associe | null
  createdAt: string
  updatedAt: string
}

export interface Associe {
  id: string
  nom: string
  prenom: string
  telephone?: string | null
  partPct: number
  totalRetire?: number
  user?: User | null
  createdAt: string
  updatedAt: string
}

export interface Fournisseur {
  id: string
  nom: string
  telephone?: string | null
  adresse?: string | null
  wilaya?: string | null
  notes?: string | null
  _count?: { achats: number; produits: number }
  createdAt: string
  updatedAt: string
}

export type TypeProduit = 'PROFILE_ALU' | 'VITRAGE' | 'JOINT' | 'QUINCAILLERIE' | 'COLLE_MOUSSE' | 'MOTEUR_VOLET' | 'AUTRE'
export type Unite = 'ML' | 'M2' | 'KG' | 'PIECE' | 'BARRE' | 'ROULEAU' | 'BOITE'

export interface Produit {
  id: string
  designation: string
  reference?: string | null
  typeProduit: TypeProduit
  unite: Unite
  prixUnitaire: number
  stockActuel: number
  stockMinimum: number
  fournisseurId?: string | null
  fournisseur?: Fournisseur | null
  createdAt: string
  updatedAt: string
}

export type StatutPaiement = 'NON_PAYE' | 'PARTIELLEMENT_PAYE' | 'PAYE'

export interface LigneAchat {
  id: string
  achatId: string
  produitId?: string | null
  produit?: Produit | null
  designation: string
  quantite: number
  prixUnitaire: number
  montantTotal: number
  createdAt: string
}

export interface PaiementAchat {
  id: string
  achatId: string
  montant: number
  datePaiement: string
  modePaiement: string
  notes?: string | null
  createdAt: string
}

export interface Achat {
  id: string
  reference: string
  fournisseurId: string
  fournisseur?: Fournisseur | null
  dateAchat: string
  montantTotal: number
  montantPaye: number
  resteAPayer: number
  statut: StatutPaiement
  notes?: string | null
  lignes?: LigneAchat[]
  paiements?: PaiementAchat[]
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  nom: string
  prenom?: string | null
  telephone?: string | null
  adresse?: string | null
  wilaya?: string | null
  notes?: string | null
  _count?: { devis: number; factures: number }
  totalFacture?: number
  createdAt: string
  updatedAt: string
}

export type StatutDevis = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'CONVERTI'

export interface LigneDevis {
  id: string
  devisId: string
  designation: string
  description?: string | null
  unite: string
  quantite: number
  prixUnitaire: number
  montantTotal: number
  ordre: number
  createdAt: string
}

export interface Devis {
  id: string
  reference: string
  clientId: string
  client?: Client | null
  dateDevis: string
  dateValidite?: string | null
  montantHT: number
  tva: number
  montantTTC: number
  statut: StatutDevis
  notes?: string | null
  lignes?: LigneDevis[]
  factures?: Facture[]
  createdAt: string
  updatedAt: string
}

export type StatutFacture = 'EN_ATTENTE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE'

export interface LigneFacture {
  id: string
  factureId: string
  designation: string
  description?: string | null
  unite: string
  quantite: number
  prixUnitaire: number
  montantTotal: number
  ordre: number
  createdAt: string
}

export interface PaiementFacture {
  id: string
  factureId: string
  montant: number
  datePaiement: string
  modePaiement: string
  notes?: string | null
  createdAt: string
}

export interface Facture {
  id: string
  reference: string
  clientId: string
  client?: Client | null
  devisId?: string | null
  devis?: Devis | null
  dateFacture: string
  dateEcheance?: string | null
  montantHT: number
  tva: number
  montantTTC: number
  montantPaye: number
  resteAPayer: number
  statut: StatutFacture
  notes?: string | null
  lignes?: LigneFacture[]
  paiements?: PaiementFacture[]
  createdAt: string
  updatedAt: string
}

export type TypeTransaction = 'ENTREE' | 'SORTIE' | 'RETRAIT' | 'AJUSTEMENT'

export interface TransactionCaisse {
  id: string
  type: TypeTransaction
  montant: number
  soldeAvant: number
  soldeApres: number
  description: string
  refType?: string | null
  refId?: string | null
  dateTransaction: string
  createdAt: string
}

export interface RetraitCaisse {
  id: string
  associeId: string
  associe?: Associe | null
  montant: number
  dateRetrait: string
  notes?: string | null
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
  timestamp?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timestamp?: string
}

export interface DashboardKPI {
  soldeCaisse: number
  totalAchatsAllTime: number
  totalRecettesAllTime: number
  beneficeAllTime: number
  impayes: {
    clientsMontant: number
    clientsCount: number
    fournisseursMontant: number
    fournisseursCount: number
  }
  associes: {
    id: string
    nom: string
    prenom: string
    partPct: number
    totalRetire: number
  }[]
}

export interface SoldeCaisse {
  solde: number
  totalEntrees: number
  totalSorties: number
  totalRetraits: number
}

export interface Bilan {
  totalAchats: number
  totalRecettes: number
  beneficeBrut: number
  soldeCaisse: number
  retraitsAssocies: {
    id: string
    nom: string
    prenom: string
    partPct: number
    totalRetire: number
    partTheorique: number
  }[]
}

export interface MensuelData {
  mois: string
  achats: number
  recettes: number
  benefice: number
}
