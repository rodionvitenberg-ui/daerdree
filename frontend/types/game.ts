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

export interface BoardGame {
  id: number;
  title: string;
  slug: string;
  category: Category | null; // Может быть null (on_delete=SET_NULL)
  tags: Tag[];
  description: string;
  image: string | null; // Картинки может не быть
  min_players: number;
  max_players: number;
  play_time: number;
  difficulty: 1 | 2 | 3 | 4 | 5; // Из твоего DIFFICULTY_CHOICES
  created_at: string;
  is_active: boolean;
}