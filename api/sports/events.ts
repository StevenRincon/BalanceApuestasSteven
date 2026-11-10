import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAccount } from '../../serverless/auth.js';
import { listFixtures } from '../../serverless/sports.js';
import { SPORTS_LEAGUES, type SportsApiCode } from '../../src/sportsCatalog.js';
import { handleError, HttpError, methodNotAllowed } from '../../serverless/http.js';

function isSport(value: unknown): value is SportsApiCode {
  return value === 'football' || value === 'basketball';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    await requireAccount(req);
    const sport = req.query.sport;
    const league = req.query.league;
    const date = req.query.date;
    if (!isSport(sport)) throw new HttpError(400, 'Deporte no compatible con la consulta de resultados.');
    if (
      typeof league !== 'string' ||
      !SPORTS_LEAGUES[sport].some((item) => item.id === league)
    ) {
      throw new HttpError(400, 'Selecciona una liga disponible.');
    }
    const parsedDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00Z`)
      : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new HttpError(400, 'La fecha debe tener el formato AAAA-MM-DD.');
    }
    const fixtures = await listFixtures(sport, league, date);
    return res.status(200).json(fixtures);
  } catch (error) {
    return handleError(res, error);
  }
}
