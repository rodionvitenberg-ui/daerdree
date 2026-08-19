import { getRequestConfig } from 'next-intl/server';
import { unstable_noStore } from 'next/cache';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  unstable_noStore();
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  let messages = {};
  try {
    const raw = await readFile(join(process.cwd(), 'messages', `${locale}.json`), 'utf8');
    messages = JSON.parse(raw);
  } catch {
    messages = {};
  }
  return { locale, messages };
});
