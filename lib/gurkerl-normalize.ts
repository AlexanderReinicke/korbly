import type { CandidateRecipe, FillerItem, RecipeStep } from "./types";

const CDN_ORIGIN = "https://cdn.gurkerl.at";
const GURKERL_ORIGIN = "https://www.gurkerl.at";

export function normalizeImageUrl(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${CDN_ORIGIN}${path}`;
}

export function productLink(productId: number): string {
  return `${GURKERL_ORIGIN}/${productId}`;
}

export function recipeDescription(ingredientsText: string): string {
  const parts = ingredientsText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "Gurkerl recipe, ready for a weeknight dinner.";
  return `${parts.slice(0, 4).join(", ")}.`;
}

export function centsFromEuro(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return Math.round(parsed * 100);
  }
  return 0;
}

export function euroFromCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function normalizeCandidate(raw: unknown, sourceQuery?: string): CandidateRecipe | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = Number(item.id ?? item.recipe_id ?? item.recipeId);
  const title = String(item.name ?? item.title ?? "").trim();
  if (!Number.isFinite(id) || !title) return null;
  const ingredientsText = String(item.ingredients ?? item.ingredientsText ?? "");
  return {
    recipeId: id,
    title,
    image: normalizeImageUrl(item.image_url ?? item.image ?? item.imgPath),
    description: recipeDescription(ingredientsText),
    timeMinutes: inferTimeMinutes(title, ingredientsText),
    ingredientsText,
    sourceQuery
  };
}

export function inferTimeMinutes(title: string, ingredientsText = ""): number {
  const text = `${title} ${ingredientsText}`.toLowerCase();
  if (text.includes("suppe") || text.includes("eintopf") || text.includes("tafelspitz")) return 75;
  if (text.includes("braten") || text.includes("gulasch")) return 60;
  if (text.includes("schnell") || text.includes("salat")) return 25;
  if (text.includes("pasta") || text.includes("spaghetti")) return 30;
  return 40;
}

export function parseServings(meta: unknown): number {
  if (!meta || typeof meta !== "object") return 2;
  const raw = String((meta as Record<string, unknown>).servings ?? "");
  const match = raw.match(/\d+/);
  const servings = match ? Number(match[0]) : 2;
  return Number.isFinite(servings) && servings > 0 ? servings : 2;
}

export function normalizeSteps(raw: unknown): RecipeStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step, index) => {
      if (!step || typeof step !== "object") return null;
      const row = step as Record<string, unknown>;
      const text = String(row.text ?? row.description ?? "").trim();
      if (!text) return null;
      return { order: Number(row.order ?? index + 1), text };
    })
    .filter((step): step is RecipeStep => Boolean(step));
}

export function normalizeFiller(raw: unknown): FillerItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const productId = Number(item.productId ?? item.product_id);
  const prices = (item.prices && typeof item.prices === "object" ? item.prices : {}) as Record<string, unknown>;
  const image = item.image && typeof item.image === "object" ? (item.image as Record<string, unknown>).path : item.imgPath;
  const productName = String(item.name ?? item.productName ?? "").trim();
  if (!Number.isFinite(productId) || !productName) return null;
  return {
    productId,
    productName,
    brand: typeof item.brand === "string" ? item.brand : null,
    image: normalizeImageUrl(image),
    link: productLink(productId),
    amount: String(item.textualAmount ?? item.amount ?? ""),
    priceCents: centsFromEuro(prices.salePrice ?? prices.originalPrice ?? item.price),
    selected: false
  };
}

export function formatTimeslot(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "earliest available slot";
  const item = raw as Record<string, unknown>;
  const candidates = [
    item.window,
    item.slotWindow,
    item.timeWindow,
    item.name,
    item.label,
    item.text,
    item.start && item.end ? `${item.start}–${item.end}` : null,
    item.from && item.to ? `${item.from}–${item.to}` : null
  ];
  const found = candidates.find((value) => typeof value === "string" && value.trim());
  return found ? String(found) : "earliest available slot";
}

export function extractOrderId(raw: unknown): string {
  const seen = new Set<unknown>();
  function walk(node: unknown): string | null {
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    const obj = node as Record<string, unknown>;
    for (const key of ["orderId", "order_id", "id", "orderNumber", "number"]) {
      const value = obj[key];
      if (typeof value === "string" || typeof value === "number") return String(value);
    }
    for (const value of Object.values(obj)) {
      const found = walk(value);
      if (found) return found;
    }
    return null;
  }
  return walk(raw) ?? "submitted";
}
