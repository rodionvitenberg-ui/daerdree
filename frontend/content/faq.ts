export interface FAQBlockMeta {
  id: string;
  image: string;
  cta?: {
    link?: string;
    icon?: 'arrow' | 'telegram';
  };
}

export const faqData: FAQBlockMeta[] = [
  {
    id: "payment-rules",
    image: "/images/hero/1.webp", 
  },
  {
    id: "rent-games",
    image: "/images/hero/2.webp",
    cta: {
      icon: "arrow"
    }
  },
  {
    id: "private-events",
    image: "/images/hero/3.webp",
    cta: {
      icon: "arrow"
    }
  },
  {
    id: "new-players",
    image: "/images/hero/4.webp",
    cta: {
      link: "https://t.me/daerdreedm", 
      icon: "telegram"
    }
  },
  {
    id: "solo-specific",
    image: "/images/hero/5.webp",
  },
  {
    id: "hours-pets",
    image: "/images/hero/6.webp",
  }
];