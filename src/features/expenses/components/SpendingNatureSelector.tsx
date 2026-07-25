import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import {
  SPENDING_NATURE_DESCRIPTIONS,
  SPENDING_NATURE_LABELS,
  type SpendingNature,
} from "../domain/types";

interface Props {
  value: SpendingNature;
  onChange: (value: SpendingNature) => void;
}

const ORDER: SpendingNature[] = [
  "normal",
  "extraordinary",
  "committed",
  "recurring",
];

export function SpendingNatureSelector({ value, onChange }: Props) {
  return (
    <OnboardingSelect
      label="Naturaleza del gasto"
      helperText={SPENDING_NATURE_DESCRIPTIONS[value]}
      value={value}
      onChange={(e) => onChange(e.target.value as SpendingNature)}
      options={ORDER.map((v) => ({
        value: v,
        label: SPENDING_NATURE_LABELS[v],
      }))}
    />
  );
}
