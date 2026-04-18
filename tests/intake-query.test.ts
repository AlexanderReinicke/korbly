import assert from "node:assert/strict";
import test from "node:test";
import { buildProductSearchKeyword, buildRecipeSearchQueries } from "../lib/intake-query";
import type { IntakeInputs } from "../lib/types";

const inputs: IntakeInputs = {
  householdSize: 3,
  dietFilters: ["Vegetarian", "Dairy-free"],
  allergyText: "cilantro, peanuts",
  needText: "easy lunches and snacks for guests",
  cuisines: ["Austrian", "Italian"]
};

test("buildRecipeSearchQueries includes every intake setting in each Gurkerl query", () => {
  const queries = buildRecipeSearchQueries(inputs);

  assert.equal(queries.length, 3);
  for (const query of queries) {
    assert.match(query, /3 Personen/);
    assert.match(query, /Austrian, Italian/);
    assert.match(query, /Vegetarian, Dairy-free/);
    assert.match(query, /cilantro, peanuts/);
    assert.match(query, /easy lunches and snacks for guests/);
  }
});

test("buildProductSearchKeyword also carries the full intake context", () => {
  const keyword = buildProductSearchKeyword("Joghurt", inputs);

  assert.match(keyword, /^Joghurt;/);
  assert.match(keyword, /3 Personen/);
  assert.match(keyword, /Austrian, Italian/);
  assert.match(keyword, /Vegetarian, Dairy-free/);
  assert.match(keyword, /cilantro, peanuts/);
  assert.match(keyword, /easy lunches and snacks for guests/);
});

test("buildIntakeContextText stays concise and skips filler defaults", async () => {
  const { buildIntakeContextText } = await import("../lib/intake-query");
  const text = buildIntakeContextText({
    householdSize: 2,
    dietFilters: [],
    allergyText: "",
    needText: "",
    cuisines: ["Austrian"]
  });

  assert.equal(text, "2 Personen; Küche: Austrian");
});
