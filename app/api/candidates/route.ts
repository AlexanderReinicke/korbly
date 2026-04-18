import { NextResponse } from "next/server";
import { z } from "zod";
import { aiDietFilter } from "@/lib/diet-filter";
import { normalizeCandidate } from "@/lib/gurkerl-normalize";
import { withHostClient } from "@/lib/mcp";
import { CUISINES, DIET_FILTERS, type CandidateRecipe, type IntakeInputs } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const IntakeSchema = z.object({
  householdSize: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  dietFilters: z.array(z.enum(DIET_FILTERS)).default([]),
  allergyText: z.string().max(500).default(""),
  cuisines: z.array(z.enum(CUISINES)).min(1).default(["Austrian"])
});

export async function POST(request: Request) {
  try {
    const inputs = IntakeSchema.parse(await request.json()) satisfies IntakeInputs;
    const queries = buildQueries(inputs);
    const candidates = await withHostClient(async (caller) => {
      const responses: Array<{ query: string; response: { data?: unknown[]; results?: unknown[] } }> = [];
      for (const query of queries) {
        const response = await caller.callTool<{ data?: unknown[]; results?: unknown[] }>(
          "search_recipes_by_vector_similarity",
          {
            query,
            limit: 5
          }
        );
        responses.push({ query, response });
      }
      const rows: CandidateRecipe[] = [];
      responses.forEach(({ query, response }) => {
        const data = Array.isArray(response.data) ? response.data : Array.isArray(response.results) ? response.results : [];
        for (const raw of data) {
          const candidate = normalizeCandidate(raw, query);
          if (candidate) rows.push(candidate);
        }
      });
      return dedupe(rows);
    });

    const filtered = await aiDietFilter(candidates, inputs);
    return NextResponse.json({ candidates: filtered.slice(0, 6) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not fetch dinner candidates." },
      { status: 400 }
    );
  }
}

function buildQueries(inputs: IntakeInputs): string[] {
  const cuisine = inputs.cuisines.join(", ");
  const diet = inputs.dietFilters.length ? `${inputs.dietFilters.join(", ")} ` : "";
  return [
    `${diet}herzhaftes Abendessen ${cuisine} Gurkerl Küche für ${inputs.householdSize} Personen`,
    `${diet}schnelles weeknight dinner ${cuisine} authentisch einfach`,
    `${diet}drei gemütliche Dinner Rezepte ${cuisine} saisonal`
  ];
}

function dedupe(candidates: CandidateRecipe[]): CandidateRecipe[] {
  const seen = new Set<number>();
  const out: CandidateRecipe[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.recipeId)) continue;
    seen.add(candidate.recipeId);
    out.push(candidate);
  }
  return out;
}
