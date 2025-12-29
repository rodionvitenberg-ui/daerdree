import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // Список всех поддерживаемых языков
  locales: ['en', 'ru'],
 
  // Язык по умолчанию, если ничего не подошло
  defaultLocale: 'en'
});
 
export const config = {
  // Матчер: говорим Next.js запускать этот middleware только на нужных путях
  // Игнорируем системные файлы (_next, favicon, иконки и т.д.)
  matcher: ['/((?!api|_next|.*\\..*).*)']
};