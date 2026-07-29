export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error ?? `HTTP ${res.status}`), { status: res.status, body });
  }
  return res.json();
}

export const api = {
  checkUsername: (u: string) => request<{ status: 'available' | 'taken' | 'invalid'; suggestions?: string[]; reason?: string }>(
    `/api/username/check?u=${encodeURIComponent(u)}`,
  ),
  claimUsername: (username: string) => request<{ id: string; username: string }>('/api/username/claim', {
    method: 'POST',
    body: JSON.stringify({ username }),
  }),
  me: () => request<{
    id: string; username: string; avatarSeed: string; countryCode: string | null; bio: string | null;
    xp: number; level: number; streakDays: number; ratings: Record<string, number>;
  }>('/api/auth/me'),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  leaderboard: (difficulty: 'easy' | 'medium' | 'hard') =>
    request<{ difficulty: string; entries: { rank: number; username: string; avatarSeed: string; countryCode: string | null; rating: number }[] }>(
      `/api/leaderboard/global?difficulty=${difficulty}`,
    ),
  dailyLeaderboard: () => request<{ date: string; entries: { rank: number; username: string; avatarSeed: string; score: number; wordsCompleted: number }[] }>(
    '/api/daily/leaderboard',
  ),
};
