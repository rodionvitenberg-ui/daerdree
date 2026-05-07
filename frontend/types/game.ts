export interface Category {
  id: number;
  name: string;
  name_ru?: string; // Добавлено
  name_en?: string; // Добавлено
  slug: string;
  icon?: string | null;
  description?: string;
  description_ru?: string; // Добавлено
  description_en?: string; // Добавлено
}

export interface Tag {
  id: number;
  name: string;
  name_ru?: string; // Добавлено
  name_en?: string; // Добавлено
  slug: string;
}

export interface Expansion {
  id: number;
  title: string;
  title_ru?: string; // Добавлено
  title_en?: string; // Добавлено
  description: string;
  description_ru?: string; // Добавлено
  description_en?: string; // Добавлено
}

export interface BoardGame {
  id: number;
  title: string;
  title_ru?: string; // Поля от django-modeltranslation
  title_en?: string;
  slug: string;
  categories: Category[];
  tags: Tag[];
  expansions?: Expansion[];
  description: string;
  description_ru?: string;
  description_en?: string;
  image: string | null;
  setup_image?: string | null;
  min_players: number;
  max_players: number;
  play_time: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  is_active: boolean;
  is_visible_ru: boolean; // Наши новые флаги видимости
  is_visible_en: boolean;
}