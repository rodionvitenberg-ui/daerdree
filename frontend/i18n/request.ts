import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'ru'];
const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Если локаль не определена или не поддерживается, ставим английский
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    // Читаем локальный JSON-файл (который будет обновлять наша CMS из Django)
    messages: (await import(`../messages/${locale}.json`)).default
  };
});