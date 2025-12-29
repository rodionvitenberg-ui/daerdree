// content/home.ts

export const HERO_CONTENT = {
  title: "THE ULTIMATE TIMECLUB",
  subtitle: "Board Games • Craft Bar • Cyber Lounge",
  buttonText: "FIND OUT MORE AND BOOK!",
  
  slides: [
    // СЛАЙД 1: Смешанный
    {
      id: 1,
      desktop: [
        { type: 'video', src: '/images/hero/2.mp4' }, 
        { type: 'image', src: '/images/hero/7.webp' }, // Исправил 'images' на 'image'
        { type: 'video', src: '/images/hero/1.mp4' }
      ],
      // Mobile теперь тоже объект, но один
      mobile: { type: 'video', src: '/images/hero/1.mp4' }
    },

    // СЛАЙД 2: Классика (только фото)
    {
      id: 2,
      desktop: [
        { type: 'image', src: '/images/hero/4.webp' },
        { type: 'image', src: '/images/hero/5.webp' },
        { type: 'image', src: '/images/hero/6.webp' }
      ],
      mobile: { type: 'image', src: '/images/hero/4.jpg' }
    },
    
    // Можешь добавить СЛАЙД 3 чисто с видео везде
  ]
};


export const BOOKING_CONTENT = {
  title: "RESERVE YOUR SPOT",
  subtitle: "Limited seats available. Members priority.",
  image: "/images/hero/3.webp", // Найди красивое вертикальное/атмосферное фото
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

// Внутри content/home.ts добавь новый объект (или расширь существующий):

// content/home.ts
export const GAMES_CONTENT = {
  title: "Library",
  subtitle: "Explore our collection",
  buttonText: "View Full List"
};