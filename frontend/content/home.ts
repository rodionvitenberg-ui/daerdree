// content/home.ts

export const HERO_CONTENT = {
  title: "THE ULTIMATE TIMECLUB",
  subtitle: "Board Games • Craft Bar • Cyber Lounge",
  buttonText: "FIND OUT MORE AND BOOK!",
  
  slides: [
    {
      id: 1,
      desktop: [
        { type: 'video', src: '/images/hero/2.mp4' }, 
        { type: 'image', src: '/images/hero/7.webp' }, // Исправил 'images' на 'image'
        { type: 'video', src: '/images/hero/1.mp4' }
      ],
      mobile: { type: 'video', src: '/images/hero/1.mp4' }
    },
    {
      id: 2,
      desktop: [
        { type: 'image', src: '/images/hero/4.webp' },
        { type: 'image', src: '/images/hero/5.webp' },
        { type: 'image', src: '/images/hero/6.webp' }
      ],
      mobile: { type: 'image', src: '/images/hero/4.webp' }
    },
  ]
};


export const BOOKING_CONTENT = {
  title: "RESERVE YOUR SPOT",
  subtitle: "Limited seats available. Members priority.",
  image: "/images/hero/3.webp", 
  form: {
    namePlaceholder: "Your Name",
    guestsPlaceholder: "Number of Guests",
    datePlaceholder: "Date & Time",
    contactPlaceholder: "Phone / Telegram",
    buttonText: "REQUEST BOOKING"
  },
  socials: {
    whatsapp: "https://wa.me/YOUR_NUMBER",
    instagram: "https://instagram.com/YOUR_PROFILE"
  }
};


export const GAMES_CONTENT = {
  title: "Library",
  subtitle: "Explore our collection",
  buttonText: "View Full List"
};

export const MENU_CONTENT = {
  title: "Our Menu",
  highlightWord: "Menu", 
  description: "От классических коктейлей до авторских миксов. Дракон рекомендует попробовать нашу фирменную текилу, которая согреет даже самое ледяное сердце.",
  buttonText: "Explore Drinks",
  imageDesktop: "/images/dragon.png", 
  imageMobile: "/images/dragon.png",  
};


export const DIVIDER_CONTENT = {
  image: "/images/separator.webp",
  alt: "Bar Interior Detail",
};

export const EVENTS_CONTENT = {
  title: "Vibe Check",
  subtitle: "Moments, Games, & Madness",
};

// Генерируем побольше карточек для плотной стены
export const EVENTS_GALLERY = [
  { id: "1", src: "/images/hero/1.webp", title: "Friday Night", height: "tall" },
  { id: "2", src: "/images/hero/2.webp", title: "DnD Masters", height: "short" },
  { id: "3", src: "/images/hero/5.webp", title: "Cocktail Art", height: "short" },
  { id: "4", src: "/images/hero/4.webp", title: "Winning Move", height: "tall" },
  { id: "5", src: "/images/hero/3.webp", title: "Cozy Corner", height: "tall" },
  { id: "6", src: "/images/hero/2.webp", title: "Mafia Don", height: "short" },
  { id: "7", src: "/images/hero/7.webp", title: "Full House", height: "short" },
  { id: "8", src: "/images/hero/6.webp", title: "Focus", height: "tall" },
  { id: "9", src: "/images/hero/5.webp", title: "Cheers", height: "tall" },
  { id: "10", src: "/images/hero/4.webp", title: "Setup", height: "short" },
  { id: "11", src: "/images/hero/3.webp", title: "Dice Roll", height: "short" },
  { id: "12", src: "/images/hero/2.webp", title: "Late Night", height: "tall" },
];

// frontend/content/home.ts

export const CATERING_STACK_CONTENT = {
  title: "Private Events",
  subtitle: "Crafting Memories, One Night at a Time",
  cards: [
    {
      id: "stack-1",
      title: "The Atmosphere",
      description: "Уютный полумрак, неоновые акценты и музыка, которая не мешает говорить.",
      image: "/images/hero/1.webp", 
    },
    {
      id: "stack-2",
      title: "Custom Menu",
      description: "Мы разработаем коктейльную карту специально под твое событие. Хочешь 'Кровь Дракона'? Сделаем.",
      image: "/images/hero/1.webp",
    },
    {
      id: "stack-3",
      title: "Tabletop Games",
      description: "Более 100 настолок в свободном доступе. Наши гейм-мастера объяснят правила и проведут партию.",
      image: "/images/hero/1.webp",
    },
    {
      id: "stack-4",
      title: "VIP Service",
      description: "Персональные бармены и официанты, которые знают, что ты пьешь, еще до того, как ты подумал.",
      image: "/images/hero/1.webp",
    },
    {
      id: "stack-5",
      title: "Your Rules",
      description: "Закрытие всего заведения под ключ. Твоя музыка, твой вайб, твои правила.",
      image: "/images/hero/1.webp",
    },
  ],
  buttonText: "Plan Your Event",
};

// frontend/content/home.ts

export const LOCATION_CONTENT = {
  title: "Find the Lair",
  subtitle: "We are waiting for you",
  address: {
    street: "69 Love St", // Твой адрес
    city: "Larnaka Bay, Cyprus",
    link: "https://goo.gl/maps/...", // Ссылка на Google Maps (для кнопки)
  },
  contact: {
    phone: "+996 555 000 000",
    email: "@daerdree.com",
    instagram: "@daerdreedm",
  },
  hours: [
    { day: "Mon - Thu", time: "16:00 - 01:00" },
    { day: "Fri - Sat", time: "16:00 - 04:00" },
    { day: "Sunday", time: "16:00 - 02:00" },
  ],
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d93561.73946255167!2d74.50945952327582!3d42.87693994348253!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x389eb7dc91b3c881%3A0x492ebaf57cdee27d!2sBishkek!5e0!3m2!1sen!2skg!4v1700000000000!5m2!1sen!2skg",
};

export const FOOTER_CONTENT = {
  logoImage: "/images/daerdree.png", 
  
  socials: [
    { name: "Instagram", link: "https://instagram.com/daerdree" },
    { name: "TikTok", link: "https://tiktok.com/@daerdree" },
    { name: "Telegram", link: "https://t.me/daerdree" },
  ],
  
  credit: "Website by Sonoroom, 2026",
};