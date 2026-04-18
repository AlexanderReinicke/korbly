import type { PlanRecord } from "./types";

const PLAN_ID_KEY = "korbly.planId";
const PLAN_KEY_PREFIX = "korbly.plan.";

function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function planCacheKey(id: string): string {
  return `${PLAN_KEY_PREFIX}${id}`;
}

export function readCachedPlan(id: string): PlanRecord | null {
  const store = getStore();
  if (!store) return null;

  try {
    const raw = store.getItem(planCacheKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanRecord;
    return parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedPlan(plan: PlanRecord): void {
  const store = getStore();
  if (!store) return;

  try {
    store.setItem(PLAN_ID_KEY, plan.id);
    store.setItem(planCacheKey(plan.id), JSON.stringify(plan));
  } catch {
    // Best-effort only.
  }
}

