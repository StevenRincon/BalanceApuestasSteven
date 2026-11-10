import type { BetStatus, BetType } from '../src/types';
import type { BetInput } from '../src/server/models';
import { calculatePotential, resolveBetSettlement } from '../src/utils/calculations';
import { HttpError } from './http';

const betTypes: BetType[] = ['SENCILLA', 'COMBINADA', 'SISTEMA', 'EN_VIVO', 'OTRA'];
const betStatuses: BetStatus[] = ['PENDIENTE', 'GANADA', 'PERDIDA', 'NULA', 'REEMBOLSADA', 'CASHOUT'];

function validString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function parseBetInput(value: unknown, previous?: BetInput): BetInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Los datos de la apuesta no son válidos.');
  }
  const input = { ...previous, ...(value as Record<string, unknown>) };
  const { bookmakerId, bookmakerName, sport, competition, event, market, betType, odds, stake, status, date } = input;
  if (
    !validString(bookmakerId, 100) || !validString(bookmakerName, 100) ||
    !validString(sport, 60) || !validString(competition, 120) ||
    !validString(event, 200) || !validString(market, 200) ||
    typeof betType !== 'string' || !betTypes.includes(betType as BetType) ||
    typeof odds !== 'number' || !Number.isFinite(odds) || odds < 1.01 ||
    typeof stake !== 'number' || !Number.isFinite(stake) || stake <= 0 ||
    typeof status !== 'string' || !betStatuses.includes(status as BetStatus) ||
    !validString(date, 40) || Number.isNaN(Date.parse(date))
  ) {
    throw new HttpError(400, 'Los datos de la apuesta no son válidos.');
  }

  return {
    bookmakerId: bookmakerId.trim(),
    bookmakerName: bookmakerName.trim(),
    sport: sport.trim(),
    competition: competition.trim(),
    event: event.trim(),
    market: market.trim(),
    betType: betType as BetType,
    odds,
    stake,
    status: status as BetStatus,
    actualReturn: typeof input.actualReturn === 'number' && Number.isFinite(input.actualReturn)
      ? Math.max(input.actualReturn, 0)
      : undefined,
    date,
    settledDate: typeof input.settledDate === 'string' ? input.settledDate : undefined,
    notes: typeof input.notes === 'string' ? input.notes.slice(0, 1000) : '',
  };
}

export function betFinancialFields(input: BetInput) {
  return {
    ...calculatePotential(input.stake, input.odds),
    ...resolveBetSettlement(input.status, input.stake, input.odds, input.actualReturn),
  };
}

export function serializeBet(bet: Record<string, unknown>) {
  const { _id, __v, ...fields } = bet;
  return {
    ...fields,
    id: String(_id),
    userId: String(bet.userId),
    createdAt: new Date(bet.createdAt as string | number | Date).toISOString(),
    updatedAt: new Date(bet.updatedAt as string | number | Date).toISOString(),
  };
}
