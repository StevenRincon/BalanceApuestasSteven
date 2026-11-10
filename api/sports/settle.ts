import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetModel } from '../../src/server/models.js';
import { requireAccount } from '../../serverless/auth.js';
import { isFinal, listFixtures } from '../../serverless/sports.js';
import { getSportsApiCode } from '../../src/sportsCatalog.js';
import { handleError, methodNotAllowed } from '../../serverless/http.js';
import { serializeBet } from '../../serverless/bets.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const account = await requireAccount(req);
    const bets = await BetModel.find({
      userId: account._id,
      status: 'PENDIENTE',
      betType: 'SENCILLA',
      providerEventId: { $exists: true, $ne: '' },
      providerLeagueId: { $exists: true, $ne: '' },
      outcomeSelection: { $in: ['HOME', 'AWAY', 'DRAW'] },
      sport: { $in: ['Fútbol', 'Baloncesto'] },
      date: { $lte: new Date().toISOString() },
    }).sort({ date: 1 }).limit(100);

    const settled = [];
    const groups = new Map<string, typeof bets>();
    for (const bet of bets) {
      const eventDate = bet.providerEventDate || new Date(bet.date).toISOString().slice(0, 10);
      const sportCode = getSportsApiCode(bet.sport);
      if (!sportCode || !bet.providerLeagueId) continue;
      const key = `${sportCode}:${bet.providerLeagueId}:${eventDate}`;
      const group = groups.get(key) || [];
      group.push(bet);
      groups.set(key, group);
    }

    for (const [key, groupedBets] of groups) {
      const [sportCode, leagueId, eventDate] = key.split(':') as ['football' | 'basketball', string, string];
      const fixtures = await listFixtures(sportCode, leagueId, eventDate);
      const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

      for (const bet of groupedBets) {
        const fixture = fixturesById.get(bet.providerEventId!);
        if (!fixture || !isFinal(fixture)) continue;

        const selection = bet.outcomeSelection;
        const homeWon = fixture.homeScore! > fixture.awayScore!;
        const awayWon = fixture.awayScore! > fixture.homeScore!;
        const draw = fixture.homeScore === fixture.awayScore;
        const won = selection === 'HOME'
          ? homeWon
          : selection === 'AWAY'
            ? awayWon
            : sportCode === 'football' && draw;

        bet.status = won ? 'GANADA' : 'PERDIDA';
        bet.actualReturn = won ? bet.potentialReturn : 0;
        bet.netProfit = won ? bet.potentialProfit : -bet.stake;
        bet.settledDate = new Date().toISOString();
        bet.officialResult = `${fixture.homeTeam} ${fixture.homeScore}-${fixture.awayScore} ${fixture.awayTeam}`;
        await bet.save();
        settled.push(serializeBet(bet.toObject() as unknown as Record<string, unknown>));
      }
    }
    return res.status(200).json(settled);
  } catch (error) {
    return handleError(res, error);
  }
}
