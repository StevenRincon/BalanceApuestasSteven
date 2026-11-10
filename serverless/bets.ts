import type { BetStatus, BetType } from '../src/types';
import type { BetInput } from '../src/server/models';
import { calculatePotential, resolveBetSettlement } from '../src/utils/calculations.js';
import { HttpError } from './http.js';
import { SPORTS_LEAGUES, getSportsApiCode } from '../src/sportsCatalog.js';

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
  const providerEventId = typeof input.providerEventId === 'string' && input.providerEventId
    ? input.providerEventId
    : undefined;
  const providerEventDate = typeof input.providerEventDate === 'string' && input.providerEventDate
    ? input.providerEventDate
    : undefined;
  const providerLeagueId = typeof input.providerLeagueId === 'string' && input.providerLeagueId
    ? input.providerLeagueId
    : undefined;
  const outcomeSelection = ['HOME', 'AWAY', 'DRAW'].includes(String(input.outcomeSelection))
    ? input.outcomeSelection as BetInput['outcomeSelection']
    : undefined;
  const supportedSport = sport === 'Fútbol' || sport === 'Baloncesto';
  const sportApiCode = typeof sport === 'string' ? getSportsApiCode(sport) : null;
  const hasProviderData =
    [input.providerEventId, input.providerEventDate, input.providerLeagueId, input.outcomeSelection]
      .some((value) => value !== undefined && value !== null && value !== '');
  const hasCompleteProviderData =
    providerEventId !== undefined &&
    providerEventDate !== undefined &&
    providerLeagueId !== undefined &&
    outcomeSelection !== undefined;
  if (
    !validString(bookmakerId, 100) || !validString(bookmakerName, 100) ||
    !validString(sport, 60) || !validString(competition, 120) ||
    !validString(event, 200) || !validString(market, 200) ||
    typeof betType !== 'string' || !betTypes.includes(betType as BetType) ||
    typeof odds !== 'number' || !Number.isFinite(odds) || odds < 1.01 ||
    typeof stake !== 'number' || !Number.isFinite(stake) || stake <= 0 ||
    typeof status !== 'string' || !betStatuses.includes(status as BetStatus) ||
    !validString(date, 40) || Number.isNaN(Date.parse(date)) ||
    (hasProviderData && !hasCompleteProviderData) ||
    (hasCompleteProviderData && (
      !/^\d{1,20}$/.test(providerEventId) ||
      !providerEventDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(providerEventDate) ||
      !supportedSport ||
      !sportApiCode ||
      !SPORTS_LEAGUES[sportApiCode].some((league) => league.id === providerLeagueId) ||
      betType !== 'SENCILLA' ||
      !['HOME', 'AWAY', 'DRAW'].includes(String(outcomeSelection)) ||
      (sport === 'Baloncesto' && outcomeSelection === 'DRAW')
    ))
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
    providerEventId,
    providerEventDate,
    providerLeagueId,
    outcomeSelection: outcomeSelection as BetInput['outcomeSelection'],
    officialResult: typeof input.officialResult === 'string' ? input.officialResult.slice(0, 250) : undefined,
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
