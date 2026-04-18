import type { IntakeInputs } from "./types";

export function buildRecipeSearchQueries(inputs: IntakeInputs): string[] {
  const context = buildIntakeContextText(inputs);
  return [
    `Herzhafte Abendessen; ${context}`,
    `Schnelle alltagstaugliche Weeknight-Dinner; ${context}`,
    `Gemütliche saisonale Dinner-Ideen; ${context}`
  ];
}

export function buildProductSearchKeyword(baseKeyword: string, inputs: IntakeInputs): string {
  const context = buildIntakeContextText(inputs, { includeNeedText: true, needLabel: "Wunsch" });
  return `${normalizeQueryText(baseKeyword, 80)}; ${context}`;
}

export function buildIntakeContextText(
  inputs: IntakeInputs,
  options: { includeNeedText?: boolean; needLabel?: string } = {}
): string {
  const includeNeedText = options.includeNeedText ?? true;
  const needLabel = options.needLabel ?? "Wunsch";
  const clauses = [
    `${inputs.householdSize} Personen`,
    inputs.cuisines.length ? `Küche: ${inputs.cuisines.join(", ")}` : "",
    inputs.dietFilters.length ? `Regeln: ${inputs.dietFilters.join(", ")}` : "",
    normalizeOptionalText(inputs.allergyText, 180) ? `Meiden: ${normalizeOptionalText(inputs.allergyText, 180)}` : ""
  ].filter(Boolean);

  const needText = normalizeOptionalText(inputs.needText, 180);
  if (includeNeedText && needText) {
    clauses.push(`${needLabel}: ${needText}`);
  }

  return clauses.join("; ");
}

export function normalizeOptionalText(value: string, max: number): string {
  return normalizeQueryText(value, max);
}

function normalizeQueryText(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}
