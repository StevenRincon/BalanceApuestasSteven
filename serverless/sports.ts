import type { SportsFixture } from '../src/api.js';
import { SPORTS_LEAGUES, type SportsApiCode } from '../src/sportsCatalog.js';
import { HttpError } from './http.js';

interface EspnTeam {
  homeAway?: string;
  score?: string;
  team?: { displayName?: string };
  athlete?: { displayName?: string };
  winner?: boolean;
  linescores?: Array<{ value?: number; displayValue?: string }>;
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
  groupings?: Array<{
    grouping?: { displayName?: string };
    competitions?: Array<{
      id?: string;
      date?: string;
      status?: { type?: { name?: string; completed?: boolean } };
      competitors?: EspnTeam[];
    }>;
  }>;
}

interface EspnScoreboard {
  leagues?: Array<{ name?: string }>;
  events?: EspnEvent[];
}

const ESPN_SPORT_PATHS: Record<SportsApiCode, string> = {
  football: 'soccer',
  basketball: 'basketball',
  tennis: 'tennis',
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

function getSetWins(competitor: EspnTeam, opponent: EspnTeam): number | null {
  const linescores = competitor.linescores;
  const opponentLinescores = opponent.linescores;
  if (!linescores?.length || !opponentLinescores?.length || linescores.length !== opponentLinescores.length) {
    return null;
  }
  return linescores.reduce((wins, score, index) => {
    const value = Number(score.value ?? score.displayValue);
    const opponentValue = Number(opponentLinescores[index].value ?? opponentLinescores[index].displayValue);
    return wins + (Number.isFinite(value) && Number.isFinite(opponentValue) && value > opponentValue ? 1 : 0);
  }, 0);
}

function normalizeTennisTournament(event: EspnEvent, leagueId: string, date: string): SportsFixture[] {
  const fixtures: SportsFixture[] = [];
  for (const grouping of event.groupings || []) {
    for (const match of grouping.competitions || []) {
      const competitors = match.competitors;
      const home = competitors && getTeam(competitors, 'home');
      const away = competitors && getTeam(competitors, 'away');
      const matchDate = match.date || event.date;
      const homePlayer = home?.athlete?.displayName || home?.team?.displayName;
      const awayPlayer = away?.athlete?.displayName || away?.team?.displayName;
      if (
        !match.id ||
        !matchDate ||
        matchDate.slice(0, 10) !== date ||
        !homePlayer ||
        !awayPlayer
      ) {
        continue;
      }

      const status = match.status?.type;
      const homeSets = getSetWins(home, away);
      const awaySets = getSetWins(away, home);
      const matchWinner = home.winner === true
        ? 'HOME'
        : away.winner === true
          ? 'AWAY'
          : null;
      fixtures.push({
        id: match.id,
        sport: 'Tenis',
        leagueId,
        competition: [event.name, grouping.grouping?.displayName].filter(Boolean).join(' · '),
        date: matchDate,
        providerDate: date,
        homeTeam: homePlayer,
        awayTeam: awayPlayer,
        homeScore: homeSets,
        awayScore: awaySets,
        status: status?.name || 'STATUS_SCHEDULED',
        completed: status?.completed === true,
        winner: matchWinner,
      });
    }
  }
  return fixtures;
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
  if (sport === 'tennis') {
    return data.events.flatMap((event) => normalizeTennisTournament(event, leagueId, date));
  }
  return data.events
    .map((event) => normalizeEvent(event, sport, leagueId, competitionName))
    .filter((fixture): fixture is SportsFixture => fixture !== null)
    .map((fixture) => ({ ...fixture, providerDate: date }));
}

export function isFinal(fixture: SportsFixture): boolean {
  if (fixture.sport === 'Tenis') {
    return fixture.completed && fixture.winner !== null && fixture.winner !== undefined;
  }
  return fixture.completed &&
    fixture.homeScore !== null &&
    fixture.awayScore !== null &&
    Number.isFinite(fixture.homeScore) &&
    Number.isFinite(fixture.awayScore);
}
