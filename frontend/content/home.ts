// content/home.ts

export const HERO_CONTENT = {
  slides: [
    {
      id: 1,
      desktop: [
        { type: 'video', src: '/images/hero/2.mp4' }, 
        { type: 'image', src: '/images/hero/7.webp' },
        { type: 'video', src: '/images/hero/1.mp4' }
      ],
      // Мобильный герой — статичное изображение (webp ~150 KB) вместо видео 12.8 MB:
      // убирает 12.8 MB из критического пути на мобильных и ускоряет LCP.
      mobile: { type: 'image', src: '/images/hero/2.webp' }
    },
  ]
};


export const BOOKING_CONTENT = {
  image: "/images/1.png", 
  socials: {
    instagram: "https://instagram.com/daerdree",
    telegram: "https://t.me/daerdreedm"
  }
};

export const MENU_CONTENT = {
  imageDesktop: "/images/dragon.png", 
  imageMobile: "/images/dragon.png",  
};


export const DIVIDER_CONTENT = {
  type: 'image',
  src: "/events/11.png",
  alt: "Private Event Atmosphere",
};

export const EVENTS_CONTENT = {
  title: "Зацени наш вайб",
  subtitle: "Самые яркие моменты из жизни нашего бара",
};

// Генерируем побольше карточек для плотной стены
export const EVENTS_GALLERY = [
  { id: "1", src: "/vibecheck/1.png", height: "tall" },
  { id: "2", src: "/vibecheck/2.png", height: "short" },
  { id: "3", src: "/vibecheck/3.jpg", height: "short" },
  { id: "4", src: "/vibecheck/4.png", height: "tall" },
  { id: "5", src: "/vibecheck/5.jpg", height: "tall" },
  { id: "6", src: "/vibecheck/6.jpg", height: "short" },
  { id: "7", src: "/vibecheck/7.jpg", height: "short" },
  { id: "8", src: "/vibecheck/8.jpg", height: "tall" },
  { id: "9", src: "/vibecheck/9.jpg", height: "tall" },
  { id: "10", src: "/vibecheck/10.jpg", height: "short" },
  { id: "11", src: "/vibecheck/11.jpg", height: "short" },
  { id: "12", src: "/vibecheck/12.jpg", height: "tall" },
];

// frontend/content/home.ts

export const CATERING_STACK_CONTENT = {
  cards: [
    {
      id: "stack-1",
      image: "/images/frames/1.jpg", 
    },
    {
      id: "stack-2",
      image: "/images/frames/2.png",
    },
    {
      id: "stack-3",
      image: "/images/frames/3.jpg",
    },
    {
      id: "stack-4",
      image: "/images/frames/4.png",
    },
    {
      id: "stack-5",
      image: "/images/frames/5.png",
    }
  ]
};

// frontend/content/home.ts

export const LOCATION_CONTENT = {
  address: {
    link: "https://goo.gl/maps/...", // Ссылка на Google Maps (для кнопки)
  },
  contact: {
    phone: "+357 95 147376",
    telegram: "@daerdreedm",
    instagram: "@daerdree",
  },
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d408.99159143182857!2d33.6287453!3d34.9081376!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzTCsDU0JzMwLjEiTiAzM8KwMzcnNDQuMSJF!5e0!3m2!1sen!2skg!4v1767123400102!5m2!1sen!2skg",
};

export const FOOTER_CONTENT = {
  logoImage: "/images/daerdree.png", 
  
  socials: [
    { name: "Instagram", link: "https://instagram.com/daerdree" },
    { name: "TikTok", link: "https://tiktok.com/@daerdree" },
    { name: "Telegram", link: "https://t.me/daerdree" },
  ],
  
  credit: "Powered by IkSoft, 2026",
};