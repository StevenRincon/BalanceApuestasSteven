import type { SportsFixture } from '../src/api.js';
import { SPORTS_LEAGUES, type SportsApiCode } from '../src/sportsCatalog.js';
import { HttpError } from './http.js';

interface EspnTeam {
  homeAway?: string;
  score?: string;
  team?: { displayName?: string };
}

interface EspnEvent {
  id?: string;
  date?: string;
  name?: string;
  competitions?: Array<{
    date?: string;
    status?: { type?: { name?: string; completed?: boolean } };
    competitors?: EspnTeam[];
  }>;
}

interface EspnScoreboard {
  leagues?: Array<{ name?: string }>;
  events?: EspnEvent[];
}

const ESPN_SPORT_PATHS: Record<SportsApiCode, string> = {
  football: 'soccer',
  basketball: 'basketball',
};

function isAllowedLeague(sport: SportsApiCode, leagueId: string): boolean {
  return SPORTS_LEAGUES[sport].some((league) => league.id === leagueId);
}

function getTeam(competitors: EspnTeam[], homeAway: 'home' | 'away'): EspnTeam | undefined {
  return competitors.find((competitor) => competitor.homeAway === homeAway);
}

function normalizeEvent(
  event: EspnEvent,
  sport: SportsApiCode,
  leagueId: string,
  competitionName: string
): SportsFixture | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors;
  const home = competitors && getTeam(competitors, 'home');
  const away = competitors && getTeam(competitors, 'away');
  const date = competition?.date || event.date;
  if (
    !event.id ||
    !date ||
    !home?.team?.displayName ||
    !away?.team?.displayName
  ) {
    return null;
  }

  const homeScore = Number(home.score);
  const awayScore = Number(away.score);
  const status = competition?.status?.type;
  return {
    id: event.id,
    sport: sport === 'basketball' ? 'Baloncesto' : 'Fútbol',
    leagueId,
    competition: competitionName,
    date,
    providerDate: date.slice(0, 10),
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeScore: Number.isFinite(homeScore) ? homeScore : null,
    awayScore: Number.isFinite(awayScore) ? awayScore : null,
    status: status?.name || 'STATUS_SCHEDULED',
    completed: status?.completed === true,
  };
}

export async function listFixtures(
  sport: SportsApiCode,
  leagueId: string,
  date: string
): Promise<SportsFixture[]> {
  if (!isAllowedLeague(sport, leagueId)) {
    throw new HttpError(400, 'La liga seleccionada no está disponible.');
  }
  const scoreboardDate = date.replace(/-/g, '');
  const url = new URL(
    `https://site.api.espn.com/apis/site/v2/sports/${ESPN_SPORT_PATHS[sport]}/${leagueId}/scoreboard`
  );
  url.searchParams.set('dates', scoreboardDate);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error('No se pudo consultar el marcador público de ESPN:', error);
    throw new HttpError(502, 'No se pudo conectar con el proveedor público de resultados.');
  }
  if (!response.ok) {
    console.error(`ESPN respondió con HTTP ${response.status} para ${sport}/${leagueId}.`);
    throw new HttpError(502, 'El proveedor público de resultados no está disponible en este momento.');
  }

  let data: EspnScoreboard;
  try {
    data = await response.json() as EspnScoreboard;
  } catch (error) {
    console.error('ESPN devolvió una respuesta JSON no válida:', error);
    throw new HttpError(502, 'El proveedor público devolvió una respuesta no válida.');
  }
  if (!Array.isArray(data.events)) {
    throw new HttpError(502, 'El proveedor público devolvió una lista de partidos no válida.');
  }

  const competitionName = data.leagues?.[0]?.name || leagueId;
  return data.events
    .map((event) => normalizeEvent(event, sport, leagueId, competitionName))
    .filter((fixture): fixture is SportsFixture => fixture !== null)
    .map((fixture) => ({ ...fixture, providerDate: date }));
}

export function isFinal(fixture: SportsFixture): boolean {
  return fixture.completed &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null &&
    Number.isFinite(fixture.homeScore) &&
    Number.isFinite(fixture.awayScore);
}
