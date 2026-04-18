import { z } from "zod";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import type { CandidateRecipe, DietFilter, IntakeInputs } from "./types";

const KEYWORDS: Record<DietFilter, RegExp> = {
  Vegetarian: /\b(hendl|chicken|rind|beef|kalb|veal|schwein|pork|speck|bacon|guanciale|wurst|schnitzel|tafelspitz|fisch|fish|lachs|salmon|garnel|shrimp|muschel|shellfish)\b/i,
  Vegan: /\b(hendl|chicken|rind|beef|kalb|veal|schwein|pork|speck|bacon|guanciale|wurst|schnitzel|tafelspitz|fisch|fish|lachs|salmon|garnel|shrimp|muschel|shellfish|ei|egg|milch|milk|butter|cream|rahm|sauerrahm|käse|kaese|cheese|joghurt|yogurt)\b/i,
  Pescatarian: /\b(hendl|chicken|rind|beef|kalb|veal|schwein|pork|speck|bacon|guanciale|wurst|schnitzel|tafelspitz)\b/i,
  "Gluten-free": /\b(spaghetti|pasta|nudel|noodle|mehl|flour|brot|bread|semmel|broesel|brösel|knödel|knoedel|gnocchi)\b/i,
  "Dairy-free": /\b(milch|milk|butter|cream|rahm|sauerrahm|käse|kaese|cheese|joghurt|yogurt|pecorino|parmesan|obers)\b/i,
  "Nut allergy": /\b(nuss|nüsse|nuesse|nut|almond|mandel|hazelnut|haselnuss|walnut|walnuss|cashew|peanut|erdnuss)\b/i,
  "Shellfish allergy": /\b(garnel|shrimp|prawn|muschel|shellfish|krabbe|crab|hummer|lobster)\b/i
};

export function deterministicDietFilter(candidates: CandidateRecipe[], inputs: IntakeInputs): CandidateRecipe[] {
  const avoid = inputs.allergyText
    .split(/[,\n]/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= 3);

  return candidates.filter((candidate) => {
    const haystack = `${candidate.title} ${candidate.description} ${candidate.ingredientsText}`.toLowerCase();
    for (const filter of inputs.dietFilters) {
      if (KEYWORDS[filter].test(haystack)) return false;
    }
    for (const term of avoid) {
      if (haystack.includes(term)) return false;
    }
    return true;
  });
}

const FilterSchema = z.object({
  recipeIds: z.array(z.number())
});

export async function aiDietFilter(candidates: CandidateRecipe[], inputs: IntakeInputs): Promise<CandidateRecipe[]> {
  if (!process.env.AI_GATEWAY_API_KEY || candidates.length === 0) return deterministicDietFilter(candidates, inputs);
  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4-6"),
      schema: FilterSchema,
      prompt: [
        "Return only recipe IDs that comply with hard dietary/allergy exclusions.",
        "Do not invent recipes. Preserve cuisine preference loosely after safety filters.",
        `Hard filters: ${inputs.dietFilters.join(", ") || "none"}.`,
        `Avoid text: ${inputs.allergyText || "none"}.`,
        `Preferred cuisines: ${inputs.cuisines.join(", ")}.`,
        "Candidates:",
        JSON.stringify(
          candidates.map((candidate) => ({
            recipeId: candidate.recipeId,
            title: candidate.title,
            description: candidate.description,
            ingredients: candidate.ingredientsText
          })),
          null,
          2
        )
      ].join("\n")
    });
    const allowed = new Set(result.object.recipeIds);
    const filtered = candidates.filter((candidate) => allowed.has(candidate.recipeId));
    return filtered.length ? filtered : deterministicDietFilter(candidates, inputs);
  } catch {
    return deterministicDietFilter(candidates, inputs);
  }
}
