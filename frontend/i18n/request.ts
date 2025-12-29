// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  // Проверяем и возвращаем локаль
  let locale = await requestLocale;
  
  if (!locale || !['en', 'ru'].includes(locale)) {
    locale = 'en';
  }
 
  return {
    locale,
    // Пока пустые сообщения, чтобы не было ошибок. Позже сюда подключим JSON файлы.
    messages: {} 
  };
});