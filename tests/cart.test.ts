import assert from "node:assert/strict";
import test from "node:test";
import { cartTotalCents, consolidateRecipes, parseAmount, quantityForIngredient, totalWithFillers } from "../lib/cart";
import type { PlanRecipe } from "../lib/types";

test("parseAmount normalizes package units", () => {
  assert.deepEqual(parseAmount("500g Spaghetti"), { value: 500, unit: "g" });
  assert.deepEqual(parseAmount("1.5 kg Erdäpfel"), { value: 1500, unit: "g" });
  assert.deepEqual(parseAmount("750 ml Suppe"), { value: 750, unit: "ml" });
  assert.deepEqual(parseAmount("2 Stk Zitronen"), { value: 2, unit: "stk" });
});

test("quantityForIngredient uses package math when units match", () => {
  assert.equal(quantityForIngredient("500g Spaghetti", "500 g", 0.5), 1);
  assert.equal(quantityForIngredient("900g Erdäpfel", "500 g", 1), 2);
  assert.equal(quantityForIngredient("4 Eier", "10 Stk", 1), 1);
});

test("quantityForIngredient falls back to scaled package count when parsing fails", () => {
  assert.equal(quantityForIngredient("a handful parsley", "1 bunch", 1.2), 2);
});

test("consolidateRecipes dedupes products across recipes and sums package quantities", () => {
  const recipes: PlanRecipe[] = [
    fakeRecipe("Pasta", 4, [
      ["500g Spaghetti", 30180, "Spaghetti", "500 g", 199],
      ["100g Pecorino", 36781, "Pecorino", "200 g", 499]
    ]),
    fakeRecipe("Cacio", 2, [
      ["250g Spaghetti", 30180, "Spaghetti", "500 g", 199]
    ])
  ];
  const cart = consolidateRecipes(recipes, 2);
  const spaghetti = cart.find((item) => item.productId === 30180);
  assert.ok(spaghetti);
  assert.equal(spaghetti.qtyNeeded, 2);
  assert.deepEqual(spaghetti.recipes, ["Pasta", "Cacio"]);
  assert.equal(cartTotalCents(cart), 897);
});

test("totalWithFillers only counts selected fillers", () => {
  const total = totalWithFillers(
    [
      {
        productId: 1,
        productName: "A",
        brand: null,
        image: null,
        link: "https://www.gurkerl.at/1",
        amount: "1",
        qtyNeeded: 1,
        unitPriceCents: 100,
        subtotalCents: 100,
        recipes: ["Dinner"],
        source: "recipe"
      }
    ],
    [
      { priceCents: 200, selected: false },
      { priceCents: 300, selected: true }
    ]
  );
  assert.equal(total, 400);
});

function fakeRecipe(
  title: string,
  servings: number,
  ingredients: Array<[string, number, string, string, number]>
): PlanRecipe {
  return {
    recipeId: Math.floor(Math.random() * 10000),
    title,
    description: title,
    image: null,
    servings,
    timeMinutes: 30,
    steps: [],
    ingredients: ingredients.map(([ingredientName, productId, productName, textualAmount, price]) => ({
      ingredientId: productId,
      ingredientName,
      productId,
      productName,
      brand: null,
      image: null,
      link: `https://www.gurkerl.at/${productId}`,
      textualAmount,
      requiredAmount: ingredientName,
      packagePriceCents: price,
      unitPriceCents: null,
      inStock: true
    }))
  };
}
