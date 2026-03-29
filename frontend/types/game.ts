// frontend/types/game.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string; // Может быть null
  description?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

// Новый интерфейс для дополнений
export interface Expansion {
  id: number;
  title: string;
  description: string;
}

export interface BoardGame {
  id: number;
  title: string;
  slug: string;
  category: Category | null; // Может быть null (on_delete=SET_NULL)
  tags: Tag[];
  expansions?: Expansion[]; // Добавили дополнения
  description: string;
  image: string | null; // Картинки может не быть
  setup_image?: string | null; // Добавили фото расклада
  min_players: number;
  max_players: number;
  play_time: number;
  difficulty: 1 | 2 | 3 | 4 | 5; // Из твоего DIFFICULTY_CHOICES
  created_at: string;
  is_active: boolean;
}