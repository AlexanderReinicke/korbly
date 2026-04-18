import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { findFirstAvailableSlot } from "@/lib/checkout";
import { extractOrderId } from "@/lib/gurkerl-normalize";
import { withUserClient } from "@/lib/mcp";
import { getPlan, incrementRateLimit, putPlan } from "@/lib/plan-store";

export const runtime = "nodejs";
export const maxDuration = 120;

type Context = {
  params: Promise<{ id: string }>;
};

const OrderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  emailMe: z.string().email().optional().or(z.literal(""))
});

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const allowed = await incrementRateLimit(`rl:order:${ip}`, 10, 60);
  if (!allowed) return NextResponse.json({ error: "Too many checkout attempts. Try again in a minute." }, { status: 429 });

  try {
    const body = OrderSchema.parse(await request.json());
    const plan = await getPlan(id);
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    if (plan.totalCents < 3900) {
      return NextResponse.json({ error: "Gurkerl requires a €39 minimum order before checkout." }, { status: 400 });
    }

    const selectedFillers = plan.fillers.filter((item) => item.selected);
    const orderItems = [
      ...plan.cart.map((item) => ({ productId: item.productId, quantity: item.qtyNeeded, source: "korbly" })),
      ...selectedFillers.map((item) => ({ productId: item.productId, quantity: 1, source: "korbly" }))
    ];

    const checkout = await withUserClient(body.email, body.password, async (caller) => {
      await caller.callTool("add_items_to_cart", { items: orderItems });

      let slot = null;
      for (const day of ["0", "1", "2", "3"] as const) {
        const slots = await caller.callTool("get_timeslots_checkout", {
          timeslots_day: day,
          include_15min_slots: false
        });
        slot = findFirstAvailableSlot(slots);
        if (slot) break;
      }
      if (!slot) throw new Error("No Gurkerl delivery slot is available for the next four days.");

      await caller.callTool("change_timeslot_checkout", { timeslot_id: slot.id });
      await caller.callTool("get_checkout", {});
      const submitted = await caller.callTool("submit_checkout", {});
      return { submitted, slot };
    });

    const order = {
      orderId: extractOrderId(checkout.submitted),
      slotWindow: checkout.slot.label,
      placedAt: new Date().toISOString()
    };
    const updated = await putPlan({ ...plan, order });
    const planUrl = new URL(`/p/${id}`, request.headers.get("origin") ?? "https://korbly.at").toString();

    if (body.emailMe && process.env.RESEND_API_KEY) {
      void sendPlanEmail(body.emailMe, planUrl).catch(() => undefined);
    }

    return NextResponse.json({ orderId: order.orderId, slotWindow: order.slotWindow, planUrl, plan: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not place the Gurkerl order." },
      { status: 400 }
    );
  }
}

async function sendPlanEmail(to: string, planUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM || "Korbly <plans@korbly.at>",
    to,
    subject: "Your Korbly dinner plan",
    text: `Your Korbly plan is ready: ${planUrl}`
  });
}
