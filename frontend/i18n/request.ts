import { getRequestConfig } from 'next-intl/server';
import { unstable_noStore } from 'next/cache';
import { readFile } from 'fs/promises';
import { join } from 'path';

const locales = ['en', 'ru'];
const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  unstable_noStore();
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale)) locale = defaultLocale;
  let messages = {};
  try {
    const raw = await readFile(join(process.cwd(), 'messages', `${locale}.json`), 'utf8');
    messages = JSON.parse(raw);
  } catch {
    messages = {};
  }
  return { locale, messages };
});
