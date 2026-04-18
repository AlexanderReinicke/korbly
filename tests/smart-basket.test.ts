import assert from "node:assert/strict";
import test from "node:test";
import { deriveSuggestionSeeds } from "../lib/smart-basket";

test("deriveSuggestionSeeds stays empty without a note", () => {
  assert.deepEqual(deriveSuggestionSeeds(""), []);
});

test("deriveSuggestionSeeds maps common brief language to grocery queries", () => {
  const seeds = deriveSuggestionSeeds("snacks for guests plus a pantry top-up");
  const keywords = seeds.map((seed) => seed.keyword);

  assert.ok(keywords.includes("Jause"));
  assert.ok(keywords.includes("Hummus"));
  assert.ok(keywords.includes("Milch"));
  assert.ok(keywords.includes("Eier"));
});
