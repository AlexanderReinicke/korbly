export const DIET_FILTERS = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Shellfish allergy"
] as const;

export const CUISINES = [
  "Austrian",
  "Italian",
  "Mediterranean",
  "Asian",
  "Mexican",
  "Indian",
  "German",
  "Comfort",
  "Healthy",
  "Quick"
] as const;

export type HouseholdSize = 2 | 3 | 4;
export type DietFilter = (typeof DIET_FILTERS)[number];
export type Cuisine = (typeof CUISINES)[number];

export type IntakeInputs = {
  householdSize: HouseholdSize;
  dietFilters: DietFilter[];
  allergyText: string;
  cuisines: Cuisine[];
};

export type CandidateRecipe = {
  recipeId: number;
  title: string;
  image: string | null;
  description: string;
  timeMinutes: number;
  ingredientsText: string;
  sourceQuery?: string;
};

export type RecipeStep = {
  order: number;
  text: string;
};

export type RecipeIngredient = {
  ingredientId: number | null;
  ingredientName: string;
  productId: number | null;
  productName: string;
  brand: string | null;
  image: string | null;
  link: string | null;
  textualAmount: string | null;
  requiredAmount: string;
  packagePriceCents: number;
  unitPriceCents: number | null;
  inStock: boolean;
};

export type PlanRecipe = {
  recipeId: number;
  title: string;
  description: string;
  image: string | null;
  servings: number;
  timeMinutes: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export type CartItem = {
  productId: number;
  productName: string;
  brand: string | null;
  image: string | null;
  link: string;
  amount: string;
  qtyNeeded: number;
  unitPriceCents: number;
  subtotalCents: number;
  recipes: string[];
  source: "recipe" | "filler";
};

export type FillerItem = {
  productId: number;
  productName: string;
  brand: string | null;
  image: string | null;
  link: string;
  amount: string;
  priceCents: number;
  selected: boolean;
};

export type OrderInfo = {
  orderId: string;
  slotWindow: string;
  placedAt: string;
};

export type PlanRecord = {
  id: string;
  inputs: IntakeInputs;
  candidates: CandidateRecipe[];
  picks: number[];
  recipes: PlanRecipe[];
  cart: CartItem[];
  fillers: FillerItem[];
  totalCents: number;
  order: OrderInfo | null;
  cooked: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type PublicPlanResponse = {
  plan: PlanRecord;
};
