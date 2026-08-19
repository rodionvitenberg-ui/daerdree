"use client";

import TaxonomyEditor from "@/components/admin/TaxonomyEditor";
import { createTag, deleteTag, listTags, patchTag } from "@/lib/admin-api";

export default function TagsPage() {
  return (
    <TaxonomyEditor
      title="Теги"
      load={listTags}
      create={(body) => createTag({ name_ru: body.name_ru, name_en: body.name_en })}
      patch={(id, body) => patchTag(id, { name_ru: body.name_ru, name_en: body.name_en })}
      remove={deleteTag}
    />
  );
}
