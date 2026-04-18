import { NextResponse } from "next/server";
import { z } from "zod";
import { patchPlan } from "@/lib/plan-store";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

const CookSchema = z.object({
  recipeId: z.number(),
  cooked: z.boolean()
});

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const body = CookSchema.parse(await request.json());
    const plan = await patchPlan(id, (current) => ({
      ...current,
      cooked: { ...current.cooked, [String(body.recipeId)]: body.cooked }
    }));
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json({ ok: true, cooked: plan.cooked });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save cooked state." },
      { status: 400 }
    );
  }
}
