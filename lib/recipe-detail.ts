import type { McpToolCaller } from "./mcp";
import type { CandidateRecipe, PlanRecipe, RecipeIngredient } from "./types";
import {
  centsFromEuro,
  inferTimeMinutes,
  normalizeImageUrl,
  normalizeSteps,
  parseServings,
  productLink,
  recipeDescription
} from "./gurkerl-normalize";

type ProductMedia = {
  image: string | null;
  link: string | null;
};

type RawProduct = Record<string, unknown>;
type RawIngredient = Record<string, unknown>;

export function normalizeRecipeDetail(
  raw: unknown,
  candidate: CandidateRecipe | null,
  media: Map<number, ProductMedia>
): PlanRecipe {
  if (!raw || typeof raw !== "object") throw new Error("Invalid Gurkerl recipe detail response.");
  const detail = raw as Record<string, unknown>;
  const meta = detail.meta && typeof detail.meta === "object" ? (detail.meta as Record<string, unknown>) : {};
  const title = String(detail.name ?? candidate?.title ?? "Gurkerl dinner");
  const ingredients = Array.isArray(detail.ingredients) ? detail.ingredients : [];
  const normalizedIngredients = ingredients.map((ingredient) => normalizeIngredient(ingredient, media));
  const ingredientsText = normalizedIngredients.map((ingredient) => ingredient.ingredientName).join(", ");

  return {
    recipeId: Number(detail.recipe_id ?? candidate?.recipeId),
    title,
    description: candidate?.description ?? recipeDescription(ingredientsText),
    image: normalizeImageUrl(meta.image) ?? candidate?.image ?? null,
    servings: parseServings(meta),
    timeMinutes: candidate?.timeMinutes ?? inferTimeMinutes(title, ingredientsText),
    ingredients: normalizedIngredients,
    steps: normalizeSteps(detail.steps)
  };
}

export async function fetchProductMedia(
  caller: McpToolCaller,
  products: Array<{ productId: number; name: string }>
): Promise<Map<number, ProductMedia>> {
  const unique = Array.from(new Map(products.map((product) => [product.productId, product])).values());
  const media = new Map<number, ProductMedia>();
  for (let index = 0; index < unique.length; index += 4) {
    const chunk = unique.slice(index, index + 4);
    const response = await caller.callTool<{
      results?: Array<{ products?: Array<Record<string, unknown>> }>;
    }>("batch_search_products", {
      queries: chunk.map((product) => ({
        keyword: product.name,
        include_fields: ["imgPath", "link"]
      }))
    });

    response.results?.forEach((result, resultIndex) => {
      const expected = chunk[resultIndex];
      const found = result.products?.find((product) => Number(product.productId) === expected.productId);
      if (!found) return;
      media.set(expected.productId, {
        image: normalizeImageUrl(found.imgPath),
        link: typeof found.link === "string" ? found.link : null
      });
    });
  }
  return media;
}

export function collectMappedProducts(rawDetails: unknown[]): Array<{ productId: number; name: string }> {
  const products: Array<{ productId: number; name: string }> = [];
  for (const raw of rawDetails) {
    if (!raw || typeof raw !== "object") continue;
    const ingredients = (raw as Record<string, unknown>).ingredients;
    if (!Array.isArray(ingredients)) continue;
    for (const ingredient of ingredients) {
      const best = bestProduct((ingredient as RawIngredient).products);
      if (!best) continue;
      products.push({
        productId: Number(best.product_id ?? best.productId),
        name: String(best.name ?? best.productName ?? "")
      });
    }
  }
  return products.filter((product) => Number.isFinite(product.productId) && product.name);
}

function normalizeIngredient(raw: unknown, media: Map<number, ProductMedia>): RecipeIngredient {
  const ingredient = raw && typeof raw === "object" ? (raw as RawIngredient) : {};
  const product = bestProduct(ingredient.products);
  const productId = product ? Number(product.product_id ?? product.productId) : null;
  const productMedia = productId ? media.get(productId) : null;
  const price = product?.price && typeof product.price === "object" ? (product.price as Record<string, unknown>) : {};
  const productName = String(product?.name ?? product?.productName ?? ingredient.ingredient_name ?? "Ingredient");
  return {
    ingredientId: Number.isFinite(Number(ingredient.ingredient_id)) ? Number(ingredient.ingredient_id) : null,
    ingredientName: String(ingredient.ingredient_name ?? productName),
    productId,
    productName,
    brand: typeof product?.brand === "string" ? product.brand : null,
    image: productMedia?.image ?? normalizeImageUrl(product?.imgPath),
    link: productId ? productLink(productId) : null,
    textualAmount: typeof product?.textual_amount === "string" ? product.textual_amount : String(product?.textualAmount ?? ""),
    requiredAmount: String(ingredient.ingredient_name ?? ""),
    packagePriceCents: centsFromEuro(price.original ?? product?.price ?? 0),
    unitPriceCents: price.unit == null ? null : centsFromEuro(price.unit),
    inStock: product?.in_stock === true || product?.inStock === true
  };
}

function bestProduct(rawProducts: unknown): RawProduct | null {
  if (!Array.isArray(rawProducts) || rawProducts.length === 0) return null;
  const inStock = rawProducts.find((product) => {
    if (!product || typeof product !== "object") return false;
    const row = product as RawProduct;
    return row.in_stock === true || row.inStock === true;
  });
  return (inStock ?? rawProducts[0]) as RawProduct;
}
