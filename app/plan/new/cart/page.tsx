import { CartClient } from "@/components/cart-client";

type Props = {
  searchParams: Promise<{ planId?: string }>;
};

export default async function CartPage({ searchParams }: Props) {
  const { planId } = await searchParams;
  return <CartClient initialPlanId={planId ?? null} />;
}
