import { buildProductSearchKeyword } from "./intake-query";
import type { McpToolCaller } from "./mcp";
import { centsFromEuro, normalizeImageUrl, normalizeFiller, productLink } from "./gurkerl-normalize";
import type { FillerItem, IntakeInputs } from "./types";

type SearchProduct = Record<string, unknown>;

type SuggestionSeed = {
  keyword: string;
  reason: string;
  kind: FillerItem["kind"];
};

const NEED_BUCKETS: Array<{
  pattern: RegExp;
  seeds: SuggestionSeed[];
}> = [
  {
    pattern: /\b(snack|snacks|jause|gäste|gaeste|party|movie|apero)\b/i,
    seeds: [
      { keyword: "Jause", reason: "Fits the snack side of your brief.", kind: "need" },
      { keyword: "Hummus", reason: "Easy to add as a snack extra.", kind: "need" },
      { keyword: "Cracker", reason: "Useful pantry-friendly snack add-on.", kind: "need" }
    ]
  },
  {
    pattern: /\b(breakfast|frühstück|fruehstueck|morgen|muesli|müsli)\b/i,
    seeds: [
      { keyword: "Joghurt", reason: "Matches a breakfast top-up.", kind: "need" },
      { keyword: "Müsli", reason: "Good breakfast pantry staple.", kind: "need" },
      { keyword: "Beeren", reason: "Fresh add-on for breakfast or dessert.", kind: "need" }
    ]
  },
  {
    pattern: /\b(basic|basics|pantry|top[\s-]?up|stock|staple|vorrat|grundbedarf|auffüllen)\b/i,
    seeds: [
      { keyword: "Milch", reason: "Solid week-start staple.", kind: "need" },
      { keyword: "Eier", reason: "Useful basic for breakfasts and quick meals.", kind: "need" },
      { keyword: "Brot", reason: "Practical everyday top-up.", kind: "need" }
    ]
  },
  {
    pattern: /\b(lunch|mittag|office|arbeit|work)\b/i,
    seeds: [
      { keyword: "Wrap", reason: "Handy lunch add-on.", kind: "need" },
      { keyword: "Mozzarella", reason: "Useful for quick lunches and salads.", kind: "need" },
      { keyword: "Salat", reason: "Easy lunch-side top-up.", kind: "need" }
    ]
  },
  {
    pattern: /\b(fruit|frucht|obst|kids|kinder|healthy|gesund)\b/i,
    seeds: [
      { keyword: "Obst", reason: "Fits a lighter, week-ready cart.", kind: "need" },
      { keyword: "Bananen", reason: "Simple everyday staple.", kind: "need" },
      { keyword: "Trauben", reason: "Easy fruit add-on.", kind: "need" }
    ]
  },
  {
    pattern: /\b(drink|drinks|getränk|getraenk|wasser|juice|saft)\b/i,
    seeds: [
      { keyword: "Mineralwasser", reason: "Useful drink top-up.", kind: "need" },
      { keyword: "Saft", reason: "Matches the drinks part of your note.", kind: "need" }
    ]
  }
];

export async function buildSmartBasketSuggestions({
  caller,
  inputs,
  needText,
  shortfallCents,
  existingProductIds
}: {
  caller: McpToolCaller;
  inputs: IntakeInputs;
  needText: string;
  shortfallCents: number;
  existingProductIds: number[];
}): Promise<FillerItem[]> {
  const taken = new Set(existingProductIds);
  const suggestions: FillerItem[] = [];

  const querySeeds = deriveSuggestionSeeds(needText).slice(0, 4);
  if (querySeeds.length) {
    const response = await caller.callTool<{
      results?: Array<{ products?: SearchProduct[] }>;
    }>("batch_search_products", {
      queries: querySeeds.map((seed) => ({
        keyword: buildProductSearchKeyword(seed.keyword, inputs),
        include_fields: ["imgPath"]
      }))
    });

    response.results?.forEach((result, index) => {
      const seed = querySeeds[index];
      if (!seed) return;
      for (const product of result.products ?? []) {
        const normalized = normalizeSearchSuggestion(product, seed);
        if (!normalized) continue;
        if (taken.has(normalized.productId)) continue;
        taken.add(normalized.productId);
        suggestions.push(normalized);
        break;
      }
    });
  }

  if (shortfallCents > 0 || suggestions.length < 3) {
    const discounted = await caller.callTool<{ products?: unknown[] }>("get_discounted_items", {
      sale_type: "sales",
      limit: 12,
      sort: "price-asc"
    });
    const deals = (discounted.products ?? [])
      .map((raw) =>
        withSuggestionMeta(normalizeFiller(raw), {
          kind: "topup",
          reason: shortfallCents > 0 ? "Useful price-conscious add-on to reach the order minimum." : "Strong value add-on from current deals."
        })
      )
      .filter((item): item is FillerItem => Boolean(item))
      .filter((item) => !taken.has(item.productId));

    for (const item of rankSuggestions(deals, shortfallCents)) {
      if (taken.has(item.productId)) continue;
      taken.add(item.productId);
      suggestions.push(item);
      if (suggestions.length >= 6) break;
    }
  }

  return markRecommended(rankSuggestions(suggestions, shortfallCents), shortfallCents).slice(0, 6);
}

export function deriveSuggestionSeeds(needText: string): SuggestionSeed[] {
  const normalized = needText.trim();
  if (!normalized) return [];

  const seen = new Set<string>();
  const out: SuggestionSeed[] = [];

  for (const bucket of NEED_BUCKETS) {
    if (!bucket.pattern.test(normalized)) continue;
    for (const seed of bucket.seeds) {
      if (seen.has(seed.keyword)) continue;
      seen.add(seed.keyword);
      out.push(seed);
    }
  }

  return out;
}

function normalizeSearchSuggestion(raw: SearchProduct, seed: SuggestionSeed): FillerItem | null {
  const productId = Number(raw.productId ?? raw.product_id);
  const productName = String(raw.productName ?? raw.name ?? "").trim();
  if (!Number.isFinite(productId) || !productName) return null;

  const price = centsFromEuro(raw.price && typeof raw.price === "object" ? (raw.price as Record<string, unknown>).full : raw.price);
  if (price <= 0) return null;

  return {
    productId,
    productName,
    brand: typeof raw.brand === "string" ? raw.brand : null,
    image: normalizeImageUrl(raw.imgPath),
    link: productLink(productId),
    amount: String(raw.textualAmount ?? raw.amount ?? "").trim(),
    priceCents: price,
    selected: false,
    kind: seed.kind,
    reason: seed.reason,
    recommended: false
  };
}

function withSuggestionMeta(
  item: Omit<FillerItem, "kind" | "reason" | "recommended"> | null,
  meta: Pick<FillerItem, "kind" | "reason">
): FillerItem | null {
  if (!item) return null;
  return {
    ...item,
    ...meta,
    recommended: false
  };
}

function rankSuggestions(items: FillerItem[], shortfallCents: number): FillerItem[] {
  return [...items].sort((left, right) => {
    const scoreLeft = scoreSuggestion(left, shortfallCents);
    const scoreRight = scoreSuggestion(right, shortfallCents);
    if (scoreLeft !== scoreRight) return scoreLeft - scoreRight;
    return left.productName.localeCompare(right.productName);
  });
}

function scoreSuggestion(item: FillerItem, shortfallCents: number): number {
  if (shortfallCents <= 0) {
    return item.kind === "need" ? item.priceCents / 100 : item.priceCents / 100 + 8;
  }

  const distance = Math.abs(item.priceCents - shortfallCents) / 100;
  const kindWeight = item.kind === "need" ? 0.6 : 0;
  return distance + kindWeight;
}

function markRecommended(items: FillerItem[], shortfallCents: number): FillerItem[] {
  if (items.length === 0) return items;
  if (shortfallCents <= 0) {
    return items.map((item, index) => ({ ...item, recommended: index === 0 }));
  }

  let covered = 0;
  return items.map((item) => {
    const recommended = covered < shortfallCents;
    if (recommended) covered += item.priceCents;
    return { ...item, recommended };
  });
}
