import { PlanPageClient } from "@/components/plan-page-client";
import { getPlan } from "@/lib/plan-store";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublicPlanPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);
  return <PlanPageClient initialPlan={plan} planId={id} />;
}
