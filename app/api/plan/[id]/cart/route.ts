import { NextResponse } from "next/server";
import { z } from "zod";
import { totalWithFillers } from "@/lib/cart";
import { patchPlan } from "@/lib/plan-store";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

const CartPatchSchema = z.object({
  productId: z.number(),
  selected: z.boolean()
});

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const body = CartPatchSchema.parse(await request.json());
    const plan = await patchPlan(id, (current) => {
      const fillers = current.fillers.map((item) =>
        item.productId === body.productId ? { ...item, selected: body.selected } : item
      );
      return { ...current, fillers, totalCents: totalWithFillers(current.cart, fillers) };
    });
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update cart." },
      { status: 400 }
    );
  }
}
