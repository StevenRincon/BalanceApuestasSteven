import type { Bet, Bookmaker, Transaction, Expense, FinancialMetrics, BetStatus } from '../types';

/**
 * Calcula el retorno y ganancia potencial de una apuesta
 */
export function calculatePotential(stake: number, odds: number): { potentialReturn: number; potentialProfit: number } {
  const safeStake = Math.max(0, Number(stake) || 0);
  const safeOdds = Math.max(1, Number(odds) || 1);
  const potentialReturn = Math.round(safeStake * safeOdds);
  const potentialProfit = Math.round(potentialReturn - safeStake);
  return { potentialReturn, potentialProfit };
}

/**
 * Determina el retorno y ganancia neta según el estado de la apuesta
 */
export function resolveBetSettlement(
  status: BetStatus,
  stake: number,
  odds: number,
  customReturn?: number
): { actualReturn: number; netProfit: number } {
  const { potentialReturn, potentialProfit } = calculatePotential(stake, odds);

  switch (status) {
    case 'GANADA':
      return { actualReturn: potentialReturn, netProfit: potentialProfit };
    case 'PERDIDA':
      return { actualReturn: 0, netProfit: -stake };
    case 'NULA':
    case 'REEMBOLSADA':
      return { actualReturn: stake, netProfit: 0 };
    case 'CASHOUT':
      const cashout = Math.max(0, Number(customReturn) || 0);
      return { actualReturn: cashout, netProfit: cashout - stake };
    case 'PENDIENTE':
    default:
      return { actualReturn: 0, netProfit: 0 };
  }
}

/**
 * Usa el saldo informado manualmente para cada casa y calcula por separado las métricas de movimientos y apuestas.
 */
export interface BookmakerBalanceInfo {
  bookmakerId: string;
  name: string;
  color: string;
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalBonuses: number;
  totalStaked: number;
  totalReturns: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  activePendingStake: number;
}

export function calculateBookmakerBalances(
  bookmakers: Bookmaker[],
  transactions: Transaction[],
  bets: Bet[]
): Record<string, BookmakerBalanceInfo> {
  const result: Record<string, BookmakerBalanceInfo> = {};

  bookmakers.forEach((bm) => {
    result[bm.id] = {
      bookmakerId: bm.id,
      name: bm.name,
      color: bm.color,
      currentBalance: Number(bm.initialBalance) || 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalBonuses: 0,
      totalStaked: 0,
      totalReturns: 0,
      grossProfit: 0,
      grossLoss: 0,
      netProfit: 0,
      activePendingStake: 0,
    };
  });

  // Mantener los movimientos como métricas independientes del saldo manual.
  transactions.forEach((tx) => {
    const bm = result[tx.bookmakerId];
    if (!bm) return;
    if (tx.type === 'DEPOSITO') bm.totalDeposited += tx.amount;
    if (tx.type === 'RETIRO') bm.totalWithdrawn += tx.amount;
    if (tx.type === 'BONO' || tx.type === 'AJUSTE') bm.totalBonuses += tx.amount;
  });

  // Procesar apuestas
  bets.forEach((bet) => {
    const bm = result[bet.bookmakerId];
    if (bm) {
      bm.totalStaked += bet.stake;

      if (bet.status === 'PENDIENTE') {
        bm.activePendingStake += bet.stake;
      } else {
        bm.totalReturns += bet.actualReturn;

        if (bet.status === 'GANADA') {
          bm.grossProfit += bet.netProfit;
        } else if (bet.status === 'PERDIDA') {
          bm.grossLoss += bet.stake;
        } else if (bet.status === 'CASHOUT') {
          if (bet.netProfit > 0) {
            bm.grossProfit += bet.netProfit;
          } else {
            bm.grossLoss += Math.abs(bet.netProfit);
          }
        }
        bm.netProfit += bet.netProfit;
      }
    }
  });

  return result;
}

/**
 * Calcula todas las métricas financieras globales consolidadas
 */
export function calculateFinancialMetrics(
  bets: Bet[],
  transactions: Transaction[],
  expenses: Expense[],
  bookmakers: Bookmaker[]
): FinancialMetrics {
  // Transacciones
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'DEPOSITO') {
      totalDeposited += tx.amount;
    } else if (tx.type === 'RETIRO') {
      totalWithdrawn += tx.amount;
    }
  });

  // Balances de casas
  const bmBalances = calculateBookmakerBalances(bookmakers, transactions, bets);
  const totalAvailableInBookmakers = Object.values(bmBalances).reduce(
    (acc, bm) => acc + bm.currentBalance,
    0
  );

  // Apuestas
  let totalBets = bets.length;
  let betsWon = 0;
  let betsLost = 0;
  let betsPending = 0;
  let betsVoid = 0;
  let betsCashout = 0;

  let totalCommittedPending = 0;
  let totalStakedClosed = 0;
  let totalStakedAll = 0;

  let grossWinnings = 0; // Ganancia neta positiva de apuestas ganadas/cashout con ganancia
  let grossLosses = 0; // Pérdida neta de apuestas perdidas o cashout en pérdida
  let netBettingProfit = 0;

  let sumOdds = 0;
  let winProfitsSum = 0;
  let lossStakesSum = 0;

  bets.forEach((bet) => {
    totalStakedAll += bet.stake;
    sumOdds += bet.odds;

    if (bet.status === 'PENDIENTE') {
      betsPending += 1;
      totalCommittedPending += bet.stake;
    } else {
      totalStakedClosed += bet.stake;

      if (bet.status === 'GANADA') {
        betsWon += 1;
        grossWinnings += bet.netProfit;
        netBettingProfit += bet.netProfit;
        winProfitsSum += bet.netProfit;
      } else if (bet.status === 'PERDIDA') {
        betsLost += 1;
        grossLosses += bet.stake;
        netBettingProfit -= bet.stake;
        lossStakesSum += bet.stake;
      } else if (bet.status === 'NULA' || bet.status === 'REEMBOLSADA') {
        betsVoid += 1;
      } else if (bet.status === 'CASHOUT') {
        betsCashout += 1;
        netBettingProfit += bet.netProfit;
        if (bet.netProfit >= 0) {
          grossWinnings += bet.netProfit;
          winProfitsSum += bet.netProfit;
        } else {
          grossLosses += Math.abs(bet.netProfit);
          lossStakesSum += Math.abs(bet.netProfit);
        }
      }
    }
  });

  // Gastos adicionales (Tipsters, VIP, canales)
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

  // Win Rate = Ganadas / (Ganadas + Perdidas)
  const decidedBetsCount = betsWon + betsLost;
  const winRate = decidedBetsCount > 0 ? (betsWon / decidedBetsCount) * 100 : 0;

  // Yield / ROI Apuestas = Ganancia Neta Apuestas / Total Invertido en apuestas cerradas
  const yieldRoi = totalStakedClosed > 0 ? (netBettingProfit / totalStakedClosed) * 100 : 0;

  // Resultado Neto Real = Ganancia Neta Apuestas - Gastos en membresías
  const netRealProfit = netBettingProfit - totalExpenses;

  // ROI Global sobre capital depositado
  const globalRoi = totalDeposited > 0 ? (netRealProfit / totalDeposited) * 100 : 0;

  // Promedios
  const avgOdds = totalBets > 0 ? sumOdds / totalBets : 0;
  const avgStake = totalBets > 0 ? totalStakedAll / totalBets : 0;
  const avgWinProfit = betsWon > 0 ? winProfitsSum / betsWon : 0;
  const avgLossStake = betsLost > 0 ? lossStakesSum / betsLost : 0;

  return {
    totalDeposited,
    totalWithdrawn,
    netCashflow: totalWithdrawn - totalDeposited,
    totalAvailableInBookmakers,
    totalCommittedPending,
    totalBets,
    betsWon,
    betsLost,
    betsPending,
    betsVoid,
    betsCashout,
    totalStakedClosed,
    totalStakedAll,
    grossWinnings,
    grossLosses,
    netBettingProfit,
    winRate,
    yieldRoi,
    totalExpenses,
    netRealProfit,
    globalRoi,
    avgOdds,
    avgStake,
    avgWinProfit,
    avgLossStake,
  };
}
