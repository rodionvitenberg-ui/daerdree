import api from './api';

export const fetcher = (url: string) => api.get(url).then(res => res.data);

export const fetchFetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
});