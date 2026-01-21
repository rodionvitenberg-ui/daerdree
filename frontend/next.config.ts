import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
    
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

export default nextConfig;