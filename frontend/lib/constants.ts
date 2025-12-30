export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://193.181.208.36:8000';

export const API_ENDPOINTS = {
  GAMES: `${API_BASE_URL}/api/games/`,
  MARQUEE: `${API_BASE_URL}/api/games/marquee/`,
};