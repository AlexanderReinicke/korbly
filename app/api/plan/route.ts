import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { cartTotalCents, consolidateRecipes } from "@/lib/cart";
import { normalizeFiller } from "@/lib/gurkerl-normalize";
import { withHostClient } from "@/lib/mcp";
import { putPlan } from "@/lib/plan-store";
import { collectMappedProducts, fetchProductMedia, normalizeRecipeDetail } from "@/lib/recipe-detail";
import { CUISINES, DIET_FILTERS, type CandidateRecipe, type IntakeInputs, type PlanRecord } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

const IntakeSchema = z.object({
  householdSize: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  dietFilters: z.array(z.enum(DIET_FILTERS)).default([]),
  allergyText: z.string().max(500).default(""),
  needText: z.string().max(600).default(""),
  cuisines: z.array(z.enum(CUISINES)).min(1)
});

const CandidateSchema = z.object({
  recipeId: z.number(),
  title: z.string(),
  image: z.string().nullable(),
  description: z.string(),
  timeMinutes: z.number(),
  ingredientsText: z.string(),
  sourceQuery: z.string().optional()
});

const PlanSchema = z.object({
  candidateIds: z.array(z.number()).length(3),
  inputs: IntakeSchema,
  candidates: z.array(CandidateSchema).default([])
});

export async function POST(request: Request) {
  try {
    const body = PlanSchema.parse(await request.json());
    const inputs = body.inputs satisfies IntakeInputs;
    const candidateMap = new Map<number, CandidateRecipe>(body.candidates.map((candidate) => [candidate.recipeId, candidate]));

    const plan = await withHostClient(async (caller) => {
      const rawDetails = [];
      for (const recipeId of body.candidateIds) {
        rawDetails.push(
          await caller.callTool("get_recipe_detail", {
            recipe_id: recipeId,
            include_product_mapping: true,
            include_meta: ["image", "author", "link"],
            include_brand: true,
            include_prices: "full"
          })
        );
      }

      const media = await fetchProductMedia(caller, collectMappedProducts(rawDetails));
      const recipes = rawDetails.map((detail, index) =>
        normalizeRecipeDetail(detail, candidateMap.get(body.candidateIds[index]) ?? null, media)
      );
      const cart = consolidateRecipes(recipes, inputs.householdSize);
      const subtotal = cartTotalCents(cart);
      const fillers =
        subtotal < 3900
          ? (
              await caller.callTool<{ products?: unknown[] }>("get_discounted_items", {
                limit: 3,
                sort: "price-asc"
              })
            ).products
              ?.map(normalizeFiller)
              .filter((item): item is NonNullable<typeof item> => Boolean(item))
              .slice(0, 3) ?? []
          : [];

      const id = nanoid(10);
      const now = new Date().toISOString();
      const record: PlanRecord = {
        id,
        inputs,
        candidates: body.candidates,
        picks: body.candidateIds,
        recipes,
        cart,
        fillers,
        totalCents: subtotal,
        order: null,
        cooked: {},
        createdAt: now,
        updatedAt: now
      };
      return putPlan(record);
    });

    return NextResponse.json({ planId: plan.id, plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build your cart." },
      { status: 400 }
    );
  }
}
