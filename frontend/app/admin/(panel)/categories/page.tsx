"use client";

import TaxonomyEditor from "@/components/admin/TaxonomyEditor";
import {
  createCategory,
  deleteCategory,
  listCategories,
  patchCategory,
} from "@/lib/admin-api";

export default function CategoriesPage() {
  return (
    <TaxonomyEditor
      title="Категории"
      withDescriptions
      load={listCategories}
      create={(body) =>
        createCategory({
          name_ru: body.name_ru,
          name_en: body.name_en,
          description_ru: body.description_ru,
          description_en: body.description_en,
        })
      }
      patch={(id, body) =>
        patchCategory(id, {
          name_ru: body.name_ru,
          name_en: body.name_en,
          description_ru: body.description_ru,
          description_en: body.description_en,
        })
      }
      remove={deleteCategory}
    />
  );
}
