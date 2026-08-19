// frontend/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Список поддерживаемых языков (только 2)
  locales: ['en', 'ru'],

  // Дефолтный язык (для всех устройств, кроме русскоязычных)
  defaultLocale: 'en',
  
  // 'as-needed' уберет /en/ из URL по умолчанию, оставив только /ru/ для русских. 
  // Если хотите, чтобы в URL всегда было /en/ или /ru/, используйте 'always'
  localePrefix: 'always' 
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|admin|django-admin|.*\\..*).*)'],
};