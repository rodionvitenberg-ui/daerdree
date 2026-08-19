import type { NextConfig } from "next";

import createNextIntlPlugin from 'next-intl/plugin';

// Указываем путь к нашему файлу конфигурации (относительно корня проекта)
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.daerdree.bar' }],
        destination: 'https://daerdree.bar/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];
    const django = process.env.DJANGO_INTERNAL_URL || 'http://127.0.0.1:8000';
    return [
      { source: '/api/:path*', destination: `${django}/api/:path*` },
      { source: '/cms/:path*', destination: `${django}/cms/:path*` },
      { source: '/django-admin/:path*', destination: `${django}/django-admin/:path*` },
      { source: '/media/:path*', destination: `${django}/media/:path*` },
    ];
  },
  images: {
    // Дефолтный оптимизатор Next.js (Sharp): ресайз по `sizes` + WebP/AVIF.
    // Локальные картинки больше не отдаются оригиналом — браузер качает
    // сжатые версии через /_next/image (ранее кастомный loader возвращал src as-is,
    // из-за чего грузились оригиналы по 3-6 MB и LCP был 8.4s).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'daerdree.bar',
        port: '',
        pathname: '/media/**',
      },
      // Добавляем HTTP версию для продакшн домена (на всякий случай)
      {
        protocol: 'http',
        hostname: 'daerdree.bar',
        port: '',
        pathname: '/media/**',
      },
      // Добавляем внешний IP сервера (ОЧЕНЬ ВАЖНО, Django часто отдает IP)
      {
        protocol: 'http',
        hostname: '193.181.208.36',
        port: '', // Порт может быть пустым или 8000, Next.js придирчив к этому
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '193.181.208.36',
        port: '8000',
        pathname: '/media/**',
      },
      // Локальная разработка
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },  
    ],
  },
};

export default withNextIntl(nextConfig);