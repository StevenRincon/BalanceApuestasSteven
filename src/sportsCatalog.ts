export type SportsApiCode = 'football' | 'basketball';

export interface SportsLeague {
  id: string;
  name: string;
}

export const SPORTS_LEAGUES: Record<SportsApiCode, SportsLeague[]> = {
  football: [
    { id: 'col.1', name: 'Colombia - Liga BetPlay' },
    { id: 'eng.1', name: 'Inglaterra - Premier League' },
    { id: 'esp.1', name: 'España - LaLiga' },
    { id: 'ger.1', name: 'Alemania - Bundesliga' },
    { id: 'ita.1', name: 'Italia - Serie A' },
    { id: 'fra.1', name: 'Francia - Ligue 1' },
    { id: 'mex.1', name: 'México - Liga MX' },
    { id: 'bra.1', name: 'Brasil - Serie A' },
    { id: 'arg.1', name: 'Argentina - Primera División' },
    { id: 'usa.1', name: 'Estados Unidos - MLS' },
  ],
  basketball: [
    { id: 'nba', name: 'NBA' },
    { id: 'wnba', name: 'WNBA' },
    { id: 'mens-college-basketball', name: 'NCAA masculina' },
  ],
};

export function getSportsApiCode(sport: string): SportsApiCode | null {
  if (sport === 'Fútbol') return 'football';
  if (sport === 'Baloncesto') return 'basketball';
  return null;
}
