import axios from 'axios';

// 1. Получаем базовый URL из окружения или ставим дефолтный
let rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// 2. Отрезаем слеш на конце, если он случайно там есть (чтобы избежать двойных слешей)
rawBaseUrl = rawBaseUrl.replace(/\/$/, '');

// 3. Железобетонная проверка: если URL не заканчивается на /api, дописываем его
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const api = axios.create({
  baseURL: baseURL,
});

// Интерцептор для синхронизации языка
export const setApiLanguage = (locale: string) => {
  api.defaults.headers.common['Accept-Language'] = locale;
};

export default api;