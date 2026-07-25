import { useMemo } from "react";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  type Category,
} from "../domain/types";
import { categoryRepository } from "../services/categoryRepository";

interface Props {
  categories: Category[];
  excludeCategoryIds: string[];
  value: string;
  onChange: (categoryId: string) => void;
  id?: string;
}

export function CategoryPickerByBlock({
  categories,
  excludeCategoryIds,
  value,
  onChange,
  id,
}: Props) {
  const excluded = useMemo(
    () => new Set(excludeCategoryIds),
    [excludeCategoryIds],
  );
  const grouped = useMemo(
    () =>
      categoryRepository.groupByBlock(
        categories.filter((c) => !excluded.has(c.id)),
      ),
    [categories, excluded],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        Categoría
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Elige una categoría…</option>
        {BLOCK_ORDER.map((block) => {
          const items = grouped[block];
          if (!items.length) return null;
          return (
            <optgroup key={block} label={BLOCK_LABELS[block]}>
              {items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
