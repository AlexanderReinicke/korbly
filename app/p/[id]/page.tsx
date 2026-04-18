import { notFound } from "next/navigation";
import { PlanClient } from "@/components/plan-client";
import { getPlan } from "@/lib/plan-store";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublicPlanPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) notFound();
  return <PlanClient initialPlan={plan} />;
}
