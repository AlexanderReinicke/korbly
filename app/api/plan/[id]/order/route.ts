import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { withUserClient } from "@/lib/mcp";
import { getPlan, incrementRateLimit, putPlan } from "@/lib/plan-store";

export const runtime = "nodejs";
export const maxDuration = 120;

type Context = {
  params: Promise<{ id: string }>;
};

const PlanSnapshotSchema = z.object({
  id: z.string(),
  totalCents: z.number(),
  cart: z.array(
    z.object({
      productId: z.number(),
      qtyNeeded: z.number()
    })
  ),
  fillers: z.array(
    z.object({
      productId: z.number(),
      selected: z.boolean()
    })
  )
});

const GurkerlOrderSchema = z.object({
  method: z.literal("gurkerl"),
  email: z.string().email(),
  password: z.string().min(1),
  emailMe: z.string().email().optional().or(z.literal("")),
  snapshot: PlanSnapshotSchema.optional()
});

const RegularOrderSchema = z.object({
  method: z.literal("regular"),
  fullName: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().trim().min(6),
  addressLine1: z.string().trim().min(5),
  postalCode: z.string().trim().min(3),
  city: z.string().trim().min(2),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
  snapshot: PlanSnapshotSchema.optional()
});

const OrderSchema = z.discriminatedUnion("method", [GurkerlOrderSchema, RegularOrderSchema]);

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const allowed = await incrementRateLimit(`rl:order:${ip}`, 10, 60);
  if (!allowed) return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });

  try {
    const rawBody = await request.json();
    const body = OrderSchema.parse(
      rawBody && typeof rawBody === "object" && !("method" in rawBody) ? { ...rawBody, method: "gurkerl" } : rawBody
    );
    const storedPlan = await getPlan(id);
    const plan =
      storedPlan ??
      (body.snapshot && body.snapshot.id === id
        ? {
            id,
            totalCents: body.snapshot.totalCents,
            cart: body.snapshot.cart,
            fillers: body.snapshot.fillers
          }
        : null);
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    if (plan.totalCents < 3900) {
      return NextResponse.json({ error: "Gurkerl requires a €39 minimum before you continue." }, { status: 400 });
    }

    const order =
      body.method === "gurkerl"
        ? await addToGurkerlCart(plan, body)
        : {
            method: "regular" as const,
            state: "details" as const,
            orderId: "regular-request",
            slotWindow: "We'll confirm the next step by email.",
            placedAt: new Date().toISOString(),
            customer: {
              fullName: body.fullName,
              email: body.email,
              phone: body.phone,
              addressLine1: body.addressLine1,
              postalCode: body.postalCode,
              city: body.city,
              notes: body.notes || ""
            }
          };

    const updated = storedPlan ? await putPlan({ ...storedPlan, order }) : null;
    const planUrl = new URL(`/p/${id}`, request.headers.get("origin") ?? "https://korbly.at").toString();

    if (body.method === "gurkerl" && body.emailMe && process.env.RESEND_API_KEY) {
      void sendPlanEmail(body.emailMe, planUrl).catch(() => undefined);
    }

    return NextResponse.json({ orderId: order.orderId, slotWindow: order.slotWindow, planUrl, plan: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save this cart step." },
      { status: 400 }
    );
  }
}

async function addToGurkerlCart(
  plan: {
    cart: Array<{ productId: number; qtyNeeded: number }>;
    fillers: Array<{ productId: number; selected: boolean }>;
  },
  body: z.infer<typeof GurkerlOrderSchema>
) {
  const selectedFillers = plan.fillers.filter((item) => item.selected);
  const orderItems = [
    ...plan.cart.map((item) => ({ productId: item.productId, quantity: item.qtyNeeded, source: "korbly" })),
    ...selectedFillers.map((item) => ({ productId: item.productId, quantity: 1, source: "korbly" }))
  ];

  await withUserClient(body.email, body.password, async (caller) => {
    await caller.callTool("add_items_to_cart", { items: orderItems });
    await caller.callTool("get_cart", {});
  });

  return {
    method: "gurkerl" as const,
    state: "cart" as const,
    orderId: "gurkerl-cart",
    slotWindow: "Continue on Gurkerl to choose delivery and payment.",
    placedAt: new Date().toISOString()
  };
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
