import { formatTimeslot } from "./gurkerl-normalize";

export type SlotChoice = {
  id: string;
  raw: unknown;
  label: string;
};

export function findFirstAvailableSlot(payload: unknown): SlotChoice | null {
  const seen = new Set<unknown>();
  function walk(node: unknown): SlotChoice | null {
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    if (Array.isArray(node)) {
      for (const child of node) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    }
    const obj = node as Record<string, unknown>;
    const id = obj.slot_id ?? obj.slotId ?? obj.timeslot_id ?? obj.timeslotId ?? obj.id;
    const unavailable =
      obj.available === false ||
      obj.isAvailable === false ||
      obj.availabilityStatus === "UNAVAILABLE" ||
      obj.disabled === true ||
      obj.soldOut === true;
    const capacity = Number(obj.capacity ?? obj.availableCapacity ?? obj.freeCapacity ?? 1);
    if ((typeof id === "string" || typeof id === "number") && !unavailable && (!Number.isFinite(capacity) || capacity > 0)) {
      return { id: String(id), raw: obj, label: formatTimeslot(obj) };
    }
    for (const child of Object.values(obj)) {
      const found = walk(child);
      if (found) return found;
    }
    return null;
  }
  return walk(payload);
}
