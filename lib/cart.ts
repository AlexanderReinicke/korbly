import type { CartItem, PlanRecipe, RecipeIngredient } from "./types";

type ParsedAmount = {
  value: number;
  unit: "g" | "ml" | "stk";
};

const UNIT_PATTERNS: Array<[RegExp, ParsedAmount["unit"], number]> = [
  [/(\d+(?:[.,]\d+)?)\s*kg\b/i, "g", 1000],
  [/(\d+(?:[.,]\d+)?)\s*g\b/i, "g", 1],
  [/(\d+(?:[.,]\d+)?)\s*l\b/i, "ml", 1000],
  [/(\d+(?:[.,]\d+)?)\s*ml\b/i, "ml", 1],
  [/(\d+(?:[.,]\d+)?)\s*(?:stk|stück|stueck)\b/i, "stk", 1]
];

export function parseAmount(text: string | null | undefined): ParsedAmount | null {
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/\bca\b/g, "").replace(/\bca\.\s*/g, "");
  for (const [pattern, unit, multiplier] of UNIT_PATTERNS) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const value = Number.parseFloat(match[1].replace(",", "."));
    if (Number.isFinite(value) && value > 0) return { value: value * multiplier, unit };
  }
  const leadingCount = normalized.match(/^\s*(\d+(?:[.,]\d+)?)(?:\s|$)/);
  if (leadingCount) {
    const value = Number.parseFloat(leadingCount[1].replace(",", "."));
    if (Number.isFinite(value) && value > 0) return { value, unit: "stk" };
  }
  return null;
}

export function quantityForIngredient(
  ingredientName: string,
  packageText: string | null,
  scale: number
): number {
  const required = parseAmount(ingredientName);
  const pack = parseAmount(packageText);
  if (required && pack && required.unit === pack.unit) {
    return Math.max(1, Math.ceil((required.value * scale) / pack.value));
  }
  return Math.max(1, Math.ceil(scale));
}

export function consolidateRecipes(recipes: PlanRecipe[], householdSize: number): CartItem[] {
  const rows = new Map<number, CartItem>();
  for (const recipe of recipes) {
    const scale = householdSize / recipe.servings;
    for (const ingredient of recipe.ingredients) {
      const item = cartItemFromIngredient(ingredient, recipe.title, scale);
      if (!item) continue;
      const existing = rows.get(item.productId);
      if (!existing) {
        rows.set(item.productId, item);
      } else {
        existing.qtyNeeded += item.qtyNeeded;
        existing.subtotalCents += item.subtotalCents;
        if (!existing.recipes.includes(recipe.title)) existing.recipes.push(recipe.title);
        existing.amount = `${existing.qtyNeeded} × ${ingredient.textualAmount ?? ingredient.requiredAmount}`;
      }
    }
  }
  return Array.from(rows.values()).sort((a, b) => a.productName.localeCompare(b.productName));
}

export function cartTotalCents(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.subtotalCents, 0);
}

export function totalWithFillers(cart: CartItem[], fillerItems: Array<{ priceCents: number; selected: boolean }>): number {
  return cartTotalCents(cart) + fillerItems.reduce((sum, item) => sum + (item.selected ? item.priceCents : 0), 0);
}

function cartItemFromIngredient(ingredient: RecipeIngredient, recipeTitle: string, scale: number): CartItem | null {
  if (!ingredient.productId || ingredient.packagePriceCents <= 0) return null;
  const qtyNeeded = quantityForIngredient(ingredient.ingredientName, ingredient.textualAmount, scale);
  return {
    productId: ingredient.productId,
    productName: ingredient.productName,
    brand: ingredient.brand,
    image: ingredient.image,
    link: ingredient.link ?? `https://www.gurkerl.at/${ingredient.productId}`,
    amount: `${qtyNeeded} × ${ingredient.textualAmount ?? ingredient.requiredAmount}`,
    qtyNeeded,
    unitPriceCents: ingredient.packagePriceCents,
    subtotalCents: ingredient.packagePriceCents * qtyNeeded,
    recipes: [recipeTitle],
    source: "recipe"
  };
}
