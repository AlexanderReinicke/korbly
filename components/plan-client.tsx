"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Basket, Check, Plate } from "@/components/icons";
import { RecipeImage } from "@/components/shared";
import { writeCachedPlan } from "@/lib/plan-cache";
import type { PlanRecord } from "@/lib/types";

export function PlanClient({ initialPlan }: { initialPlan: PlanRecord }) {
  const [plan, setPlan] = useState(initialPlan);
  useEffect(() => {
    writeCachedPlan(plan);
  }, [plan]);
  const totalTime = plan.recipes.reduce((sum, recipe) => sum + recipe.timeMinutes, 0);
  const isRegularOrder = plan.order?.method === "regular";
  const isGurkerlCart = !isRegularOrder && plan.order?.state === "cart";
  const orderMeta = plan.order
    ? isRegularOrder
      ? "Details saved"
      : isGurkerlCart
      ? "Gurkerl cart"
      : plan.order.orderId && plan.order.orderId !== "submitted"
      ? `#${plan.order.orderId}`
      : "Gurkerl xKorbly"
    : `/p/${plan.id}`;

  async function toggleCooked(recipeId: number, cooked: boolean) {
    setPlan((current) => ({ ...current, cooked: { ...current.cooked, [String(recipeId)]: cooked } }));
    try {
      await fetch(`/api/plan/${plan.id}/cook`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipeId, cooked })
      });
    } catch {
      setPlan((current) => ({ ...current, cooked: { ...current.cooked, [String(recipeId)]: !cooked } }));
    }
  }

  return (
    <main className="paper-grain" style={{ minHeight: "100vh" }}>
      <div style={{ background: "var(--ink)", color: "var(--paper)", minHeight: 56, display: "flex", alignItems: "center" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", paddingTop: 12, paddingBottom: 12 }}>
          <div className="flex gap-16" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/" className="t-display-s">
              Korbly
            </Link>
            {plan.order ? (
              <>
                <span className="badge herb">
                  <Check size={10} /> {isRegularOrder ? "Details saved" : isGurkerlCart ? "Added to Gurkerl cart" : "Order placed"}
                </span>
                <span className="t-data-m" style={{ opacity: 0.7 }}>
                  {isRegularOrder
                    ? `Korbly regular customer · ${plan.order.slotWindow}`
                    : isGurkerlCart
                    ? `On Gurkerl · ${plan.order.slotWindow}`
                    : `Gurkerl order · delivery ${plan.order.slotWindow}`}
                </span>
              </>
            ) : (
              <span className="t-data-m" style={{ opacity: 0.7 }}>Plan saved. Checkout not placed yet.</span>
            )}
          </div>
          <div className="t-data-m" style={{ opacity: 0.7 }}>
            {orderMeta}
          </div>
        </div>
      </div>

      <div className="container-narrow" style={{ padding: "80px 32px 120px" }}>
        <div>
          <span className="t-label-xs ink-paprika">Planned {new Date(plan.createdAt).toLocaleDateString("en-AT")}</span>
        </div>
        <h1 className="t-display-l mt-12" style={{ margin: "12px 0 0", maxWidth: 640 }}>
          Your week of <i>{plan.inputs.cuisines[0] || "Gurkerl"}</i> dinners.
        </h1>
        <div className="kv" style={{ marginTop: 48 }}>
          <div className="k">Cooking for</div>
          <div className="v">{plan.inputs.householdSize} people</div>
          <div className="k">Recipes</div>
          <div className="v">{plan.recipes.length}</div>
          <div className="k">Active time</div>
          <div className="v">about {totalTime} min total</div>
          <div className="k">URL</div>
          <div className="v">
            <span className="t-data-m">korbly.at/p/{plan.id}</span>
          </div>
        </div>

        <hr className="rule mt-48 mb-24" />

        {plan.recipes.map((recipe, index) => {
          const cooked = Boolean(plan.cooked[String(recipe.recipeId)]);
          return (
            <article key={recipe.recipeId} style={{ marginBottom: 128, opacity: cooked ? 0.68 : 1 }}>
              <div className="photo-ph" style={{ aspectRatio: "16/9", borderRadius: 16 }}>
                <RecipeImage src={recipe.image} alt={recipe.title} icon={<Plate size={120} />} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginTop: 32 }}>
                <div style={{ flex: 1 }}>
                  <span className="t-label-xs ink-soft">
                    Dinner No. {String(index + 1).padStart(2, "0")} · {recipe.timeMinutes} min
                  </span>
                  <h2 className="t-display-l mt-8" style={{ margin: 0 }}>{recipe.title}</h2>
                  <p className="t-body-l ink-soft mt-16">{recipe.description}</p>
                </div>
                <CookedStamp checked={cooked} onToggle={() => toggleCooked(recipe.recipeId, !cooked)} />
              </div>

              <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 48, marginTop: 48 }}>
                <div>
                  <div className="t-label-xs mb-16">Ingredients</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {recipe.ingredients.map((ingredient) => (
                      <li key={`${recipe.recipeId}-${ingredient.ingredientId}-${ingredient.productId}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--rule)" }}>
                        <div style={{ width: 22, height: 22, display: "grid", placeItems: "center", color: "var(--ink)", flexShrink: 0, opacity: ingredient.image ? 1 : 0.45, overflow: "hidden", borderRadius: 9999 }}>
                          {ingredient.image ? <img src={ingredient.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Basket size={20} />}
                        </div>
                        {ingredient.link ? (
                          <a href={ingredient.link} target="_blank" rel="noreferrer" className="t-body-m ul" style={{ flex: 1 }}>
                            {ingredient.productName}
                          </a>
                        ) : (
                          <span className="t-body-m" style={{ flex: 1 }}>{ingredient.productName}</span>
                        )}
                        <span className="t-data-m ink-soft">{ingredient.requiredAmount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="t-label-xs mb-16">Method</div>
                  <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 24 }}>
                    {recipe.steps.map((step) => (
                      <li key={step.order} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <span className="t-data-m" style={{ color: "var(--paprika)", minWidth: 32, paddingTop: 6 }}>{String(step.order).padStart(2, "0")}</span>
                        <p className="t-body-l" style={{ margin: 0, lineHeight: 1.65, maxWidth: 520 }}>{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          );
        })}

        <hr className="rule mt-64 mb-24" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div className="t-body-s ink-soft">
            Bookmark this page. Come back every night for the recipes.
          </div>
          <div className="t-label-xs ink-whisper">Korbly · Wien</div>
        </div>
      </div>
    </main>
  );
}

function CookedStamp({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <motion.button
      className={`stamp ${checked ? "checked" : ""}`}
      onClick={onToggle}
      initial={false}
      animate={checked ? { scale: [0.8, 1.1, 1], rotate: 3 } : { rotate: -4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      cooked
      <br />
      it
    </motion.button>
  );
}
