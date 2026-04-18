"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanClient } from "@/components/plan-client";
import { readCachedPlan, writeCachedPlan } from "@/lib/plan-cache";
import type { PlanRecord } from "@/lib/types";

export function PlanPageClient({ initialPlan, planId }: { initialPlan: PlanRecord | null; planId: string }) {
  const [plan, setPlan] = useState<PlanRecord | null>(initialPlan);
  const [checkedCache, setCheckedCache] = useState(Boolean(initialPlan));

  useEffect(() => {
    if (initialPlan) {
      writeCachedPlan(initialPlan);
      setPlan(initialPlan);
      setCheckedCache(true);
      return;
    }

    setPlan(readCachedPlan(planId));
    setCheckedCache(true);
  }, [initialPlan, planId]);

  if (!checkedCache) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <div className="container-card" style={{ padding: "96px 24px" }}>
          <div className="skeleton" style={{ height: 72, maxWidth: 620, borderRadius: 12 }} />
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <div className="container-card" style={{ padding: "96px 24px" }}>
          <h1 className="t-display-l" style={{ margin: 0 }}>
            Plan not found.
          </h1>
          <p className="t-body-m ink-soft mt-16">
            This link is only available on this device until server-side plan storage is configured.
          </p>
          <Link className="btn btn-primary mt-32" href="/plan/new">
            Start again
          </Link>
        </div>
      </main>
    );
  }

  return <PlanClient initialPlan={plan} />;
}
