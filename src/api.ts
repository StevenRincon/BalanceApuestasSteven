import type { Bet, User } from './types';
import type { SportsApiCode } from './sportsCatalog';
import { INITIAL_BETS } from './data/seedData';

export type NewBet = Omit<
  Bet,
  'id' | 'createdAt' | 'updatedAt' | 'userId' | 'potentialReturn' | 'potentialProfit' | 'netProfit' | 'actualReturn'
> & { actualReturn?: number };

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body.message || 'No se pudo completar la solicitud', response.status);
  }
  return body as T;
}

export interface Credentials {
  email: string;
  password: string;
  name?: string;
}

export interface SportsFixture {
  id: string;
  sport: 'Fútbol' | 'Baloncesto' | 'Tenis';
  leagueId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  providerDate: string;
  status: string;
  completed: boolean;
  homeScore: number | null;
  awayScore: number | null;
  winner?: 'HOME' | 'AWAY' | null;
}

export const authApi = {
  currentUser: async () => {
    try {
      return await request<User>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  login: (credentials: Credentials) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (credentials: Credentials) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request<{ success: true }>('/auth/logout', { method: 'POST' }),
};

export const sportsApi = {
  fixtures: (sport: SportsApiCode, league: string, date: string) =>
    request<SportsFixture[]>(
      `/sports/events?sport=${sport}&league=${encodeURIComponent(league)}&date=${encodeURIComponent(date)}`
    ),
  settle: () => request<Bet[]>('/sports/settle', { method: 'POST' }),
};

export const betsApi = {
  list: () => request<Bet[]>('/bets'),
  create: (bet: NewBet) =>
    request<Bet>('/bets', { method: 'POST', body: JSON.stringify(bet) }),
  replace: (bets: NewBet[]) =>
    request<Bet[]>('/bets', { method: 'PUT', body: JSON.stringify({ bets }) }),
  clear: () => request<{ success: true }>('/bets', { method: 'DELETE' }),
  update: (id: string, bet: Partial<Bet>) =>
    request<Bet>(`/bets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(bet),
    }),
  delete: (id: string) =>
    request<{ success: true }>(`/bets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export function getLegacyBets(): Bet[] {
  try {
    const saved = localStorage.getItem('betstats_cop_bets');
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    const seedIds = new Set(INITIAL_BETS.map((bet) => bet.id));
    return parsed.filter((bet): bet is Bet =>
      typeof bet === 'object' && bet !== null &&
      'id' in bet && typeof bet.id === 'string' && !seedIds.has(bet.id) &&
      'event' in bet && typeof bet.event === 'string'
    );
  } catch {
    return [];
  }
}
