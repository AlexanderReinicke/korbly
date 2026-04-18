import type { PlanRecord } from "./types";

type MemoryStore = Map<string, PlanRecord>;

declare global {
  var __korblyPlans: MemoryStore | undefined;
}

function memoryStore(): MemoryStore {
  globalThis.__korblyPlans ??= new Map<string, PlanRecord>();
  return globalThis.__korblyPlans;
}

function hasKvEnv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvClient() {
  if (!hasKvEnv()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Vercel KV is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.");
    }
    return null;
  }
  const { kv } = await import("@vercel/kv");
  return kv;
}

function key(id: string): string {
  return `plans:${id}`;
}

export async function getPlan(id: string): Promise<PlanRecord | null> {
  const kv = await kvClient();
  if (!kv) return memoryStore().get(id) ?? null;
  return (await kv.get<PlanRecord>(key(id))) ?? null;
}

export async function putPlan(plan: PlanRecord): Promise<PlanRecord> {
  const updated = { ...plan, updatedAt: new Date().toISOString() };
  const kv = await kvClient();
  if (!kv) {
    memoryStore().set(updated.id, updated);
    return updated;
  }
  await kv.set(key(updated.id), updated);
  return updated;
}

export async function patchPlan(
  id: string,
  updater: (plan: PlanRecord) => PlanRecord | Promise<PlanRecord>
): Promise<PlanRecord | null> {
  const current = await getPlan(id);
  if (!current) return null;
  return putPlan(await updater(current));
}

export async function incrementRateLimit(name: string, limit: number, windowSeconds: number): Promise<boolean> {
  const kv = await kvClient();
  if (!kv) return true;
  const count = await kv.incr(name);
  if (count === 1) await kv.expire(name, windowSeconds);
  return count <= limit;
}
