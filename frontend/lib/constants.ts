export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://daerdree.bar';

export const API_ENDPOINTS = {
  GAMES: `${API_BASE_URL}/api/games/`,
  MARQUEE: `${API_BASE_URL}/api/games/marquee/`,
};