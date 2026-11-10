/**
 * Modelos y Tipos Principales para BetStats COP
 * Plataforma de Control Financiero y Estadísticas de Apuestas Deportivas
 */

export type BetStatus = 
  | 'PENDIENTE' 
  | 'GANADA' 
  | 'PERDIDA' 
  | 'NULA' 
  | 'REEMBOLSADA' 
  | 'CASHOUT';

export type BetType = 
  | 'SENCILLA' 
  | 'COMBINADA' 
  | 'SISTEMA' 
  | 'EN_VIVO' 
  | 'OTRA';

export interface Bet {
  id: string;
  userId: string;
  bookmakerId: string;
  bookmakerName: string;
  sport: string;
  competition: string;
  event: string;
  market: string;
  betType: BetType;
  odds: number;
  stake: number; // Inversión en COP
  potentialReturn: number; // stake * odds
  potentialProfit: number; // potentialReturn - stake
  status: BetStatus;
  actualReturn: number; // Retorno real obtenido (COP)
  netProfit: number; // actualReturn - stake (para apuestas cerradas)
  date: string; // ISO string YYYY-MM-DDTHH:mm
  settledDate?: string;
  providerEventId?: string | null;
  providerEventDate?: string | null;
  providerLeagueId?: string | null;
  outcomeSelection?: 'HOME' | 'AWAY' | 'DRAW' | null;
  officialResult?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmaker {
  id: string;
  userId: string;
  name: string;
  color: string;
  logo?: string;
  website?: string;
  initialBalance: number; // Saldo actual introducido manualmente
  notes?: string;
  createdAt: string;
}

export type TransactionType = 
  | 'DEPOSITO' 
  | 'RETIRO' 
  | 'BONO' 
  | 'AJUSTE' 
  | 'TRANSFERENCIA';

export type PaymentMethod = 
  | 'PSE' 
  | 'Nequi' 
  | 'Daviplata' 
  | 'Bancolombia' 
  | 'Tarjeta de Crédito' 
  | 'Tarjeta Débito' 
  | 'Efecty' 
  | 'SuRed / Baloto' 
  | 'Transferencia Bancaria' 
  | 'Efectivo' 
  | 'Otro';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  bookmakerId: string;
  bookmakerName: string;
  destinationBookmakerId?: string;
  destinationBookmakerName?: string;
  amount: number; // en COP
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'PRONOSTICOS' 
  | 'APUESTAS_COMPRADAS' 
  | 'GRUPO_VIP' 
  | 'TELEGRAM' 
  | 'WHATSAPP' 
  | 'ESTRATEGIAS' 
  | 'SOFTWARE' 
  | 'OTRO';

export type ExpenseDuration = 
  | 'UNICO' 
  | 'SEMANAL' 
  | 'MENSUAL' 
  | 'TRIMESTRAL' 
  | 'SEMESTRAL' 
  | 'ANUAL';

export interface Expense {
  id: string;
  userId: string;
  title: string;
  category: ExpenseCategory;
  amount: number; // en COP
  date: string;
  provider: string; // Tipster, Canal o Plataforma
  duration: ExpenseDuration;
  expiryDate?: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bankrollGoal?: number;
  createdAt: string;
}

export interface FinancialMetrics {
  // Capital de casas
  totalDeposited: number;
  totalWithdrawn: number;
  netCashflow: number; // Retiros - Depósitos
  totalAvailableInBookmakers: number;
  totalCommittedPending: number;
  
  // Apuestas
  totalBets: number;
  betsWon: number;
  betsLost: number;
  betsPending: number;
  betsVoid: number;
  betsCashout: number;
  
  // Rendimiento apuestas
  totalStakedClosed: number;
  totalStakedAll: number;
  grossWinnings: number; // Ganancias brutas de apuestas ganadas
  grossLosses: number; // Pérdidas brutas
  netBettingProfit: number; // Gross Winnings - Gross Losses
  winRate: number; // % efectividad ganadas / (ganadas + perdidas)
  yieldRoi: number; // Rentabilidad sobre inversión en apuestas (%)
  
  // Gastos
  totalExpenses: number;
  
  // Resultado Neto Real
  netRealProfit: number; // netBettingProfit - totalExpenses
  globalRoi: number; // netRealProfit / totalDeposited (%)
  
  // Promedios
  avgOdds: number;
  avgStake: number;
  avgWinProfit: number;
  avgLossStake: number;
}
