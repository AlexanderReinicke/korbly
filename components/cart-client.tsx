"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Basket, Check, Knife, Plate } from "@/components/icons";
import { ErrorNote, MiniNav, RecipeImage, money } from "@/components/shared";
import { totalWithFillers } from "@/lib/cart";
import { readCachedPlan, writeCachedPlan } from "@/lib/plan-cache";
import type { CartItem, FillerItem, PlanRecord } from "@/lib/types";

export function CartClient({ initialPlanId }: { initialPlanId: string | null }) {
  const router = useRouter();
  const [planId, setPlanId] = useState(initialPlanId);
  const [plan, setPlan] = useState<PlanRecord | null>(null);
  const [usingCachedPlan, setUsingCachedPlan] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showAllGroceries, setShowAllGroceries] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = initialPlanId ?? sessionStorage.getItem("korbly.planId");
    setPlanId(id);
    setShowAllGroceries(false);
    if (!id) {
      setLoading(false);
      setError("No plan ID found. Build a cart from three dinners first.");
      return;
    }
    const cachedPlan = readCachedPlan(id);
    if (cachedPlan) {
      setPlan(cachedPlan);
      setUsingCachedPlan(true);
      setLoading(false);
    }
    void fetchPlan(id, cachedPlan);
  }, [initialPlanId]);

  async function fetchPlan(id: string, cachedPlan: PlanRecord | null = null) {
    if (!cachedPlan) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/plan/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Plan not found.");
      setPlan(data.plan);
      writeCachedPlan(data.plan);
      setUsingCachedPlan(false);
    } catch (err) {
      if (cachedPlan) {
        setPlan(cachedPlan);
        setUsingCachedPlan(true);
        setError("");
      } else {
        setError(err instanceof Error ? err.message : "Plan not found.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleFiller(item: FillerItem) {
    if (!planId || !plan) return;
    setUpdating(item.productId);
    setError("");
    try {
      const response = await fetch(`/api/plan/${planId}/cart`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: item.productId, selected: !item.selected })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update cart.");
      setPlan(data.plan);
      writeCachedPlan(data.plan);
      setUsingCachedPlan(false);
    } catch {
      const fillers = plan.fillers.map((current) =>
        current.productId === item.productId ? { ...current, selected: !item.selected } : current
      );
      const nextPlan = {
        ...plan,
        fillers,
        totalCents: totalWithFillers(plan.cart, fillers)
      };
      setPlan(nextPlan);
      writeCachedPlan(nextPlan);
      setUsingCachedPlan(true);
      setError("");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <MiniNav step="cart" />
        <div className="container" style={{ padding: "64px 32px" }}>
          <div className="skeleton" style={{ height: 72, maxWidth: 620, borderRadius: 12 }} />
          <div className="skeleton mt-32" style={{ height: 420, borderRadius: 12 }} />
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main style={{ minHeight: "100vh" }}>
        <MiniNav step="cart" />
        <div className="container-card" style={{ padding: "96px 24px" }}>
          <h1 className="t-display-l" style={{ margin: 0 }}>
            Cart not found.
          </h1>
          <ErrorNote>{error}</ErrorNote>
          <Link className="btn btn-primary mt-32" href="/plan/new">
            Start again
          </Link>
        </div>
      </main>
    );
  }

  const met = plan.totalCents >= 3900;
  const pct = Math.min(100, (plan.totalCents / 3900) * 100);
  const selectedExtras = plan.fillers.filter((item) => item.selected);
  const sharedGroceries = plan.cart.filter((item) => item.recipes.length > 1);
  const groceryLines = plan.cart.length + selectedExtras.length;
  const shortfallCents = Math.max(0, 3900 - plan.totalCents);
  const groceryPreviewCount = 5;
  const groceryEntries = [
    ...plan.cart.map((item) => ({ type: "cart" as const, item })),
    ...selectedExtras.map((item) => ({ type: "extra" as const, item }))
  ];
  const visibleGroceries = showAllGroceries ? groceryEntries : groceryEntries.slice(0, groceryPreviewCount);
  const hiddenGroceriesCount = Math.max(0, groceryEntries.length - groceryPreviewCount);

  return (
    <main className="paper-grain" style={{ minHeight: "100vh" }}>
      <MiniNav step="cart" />
      <div className="container" style={{ padding: "56px 32px 96px" }}>
        <div className="basket-shell">
          <section className="basket-main">
            <span className="t-label-xs ink-paprika">Step 3 of 3</span>
            <h1 className="t-display-l mt-12" style={{ margin: 0, maxWidth: 760 }}>
              Your <i>three dinners,</i> one smarter cart.
            </h1>
            <section className="basket-section basket-section-first mt-32">
              <div className="basket-section-head">
                <h2 className="t-display-m" style={{ margin: 0 }}>
                  Selected dinners
                </h2>
                <div className="t-body-s ink-soft">{plan.recipes.length} selected</div>
              </div>
              <div className="basket-recipe-strip mt-20">
                {plan.recipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.recipeId}
                    className="basket-recipe-tile"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.28 }}
                  >
                    <div className="photo-ph basket-recipe-media">
                      <RecipeImage src={recipe.image} alt={recipe.title} icon={<Plate size={30} />} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="t-label-xs ink-soft">Dinner {String(index + 1).padStart(2, "0")}</div>
                      <div className="t-body-m basket-recipe-title mt-6" style={{ fontWeight: 500 }}>
                        {recipe.title}
                      </div>
                      <div className="basket-recipe-meta mt-8">
                        <span className="t-body-s ink-soft">{recipe.ingredients.length} items</span>
                        <span className="t-body-s ink-soft">{recipe.timeMinutes} min</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="basket-section mt-48">
              <div className="basket-section-head">
                <h2 className="t-display-m" style={{ margin: 0 }}>
                  Groceries
                </h2>
                <div className="t-body-s ink-soft">
                  {sharedGroceries.length ? `${groceryLines} lines · ${sharedGroceries.length} shared items merged` : `${groceryLines} lines ready`}
                </div>
              </div>
              <div className="basket-list mt-20" id="groceries-list">
                {visibleGroceries.map((entry) =>
                  entry.type === "cart" ? (
                    <CartLineRow key={entry.item.productId} item={entry.item} />
                  ) : (
                    <SelectedExtraRow
                      key={`extra-${entry.item.productId}`}
                      item={entry.item}
                      onToggle={() => toggleFiller(entry.item)}
                      busy={updating === entry.item.productId}
                    />
                  )
                )}
              </div>
              {hiddenGroceriesCount > 0 ? (
                <div className="mt-20">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setShowAllGroceries((current) => !current)}
                    aria-controls="groceries-list"
                    aria-expanded={showAllGroceries}
                  >
                    {showAllGroceries ? `Show fewer groceries` : `Show all ${groceryLines} groceries`}
                  </button>
                </div>
              ) : null}
            </section>

            {plan.fillers.length > 0 ? (
              <section className="basket-section mt-48">
                <div className="basket-section-head basket-section-head-support">
                  <div className="basket-section-copy">
                    <span className="t-label-xs ink-paprika">Support the cart</span>
                    <h2 className="t-display-m mt-8" style={{ margin: 0 }}>
                      {met ? "Useful extras" : "Suggested add-ons"}
                    </h2>
                  </div>
                  <p className="t-body-s ink-soft basket-section-note" style={{ margin: 0 }}>
                    {met
                      ? "Optional picks based on your brief and current deals."
                      : `Pick a few items to clear the €39 minimum. You are ${money(shortfallCents)} short.`}
                  </p>
                </div>
                <div className="basket-suggestion-grid mt-20">
                  {plan.fillers.map((item) => (
                    <SuggestionCard
                      key={item.productId}
                      item={item}
                      busy={updating === item.productId}
                      onToggle={() => toggleFiller(item)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {usingCachedPlan ? (
              <div className="t-body-s ink-soft mt-24">
                Using the cart saved in this browser because persistent plan storage is not configured on the server yet.
              </div>
            ) : null}

            <ErrorNote>{error}</ErrorNote>
          </section>

          <aside className="basket-aside">
            <div className="basket-summary-card">
              <span className={`badge ${met ? "herb" : "outline"}`}>
                {met ? <Check size={12} /> : null}
                {met ? "Ready to add" : "Needs a few extras"}
              </span>
              <div className="t-label-xs ink-soft mt-20">Current cart</div>
              <div className="t-display-l mt-8" style={{ margin: "8px 0 0" }}>
                {money(plan.totalCents)}
              </div>
              <div className="t-body-s ink-soft mt-8">
                {groceryLines} lines · {plan.recipes.length} dinners · live Gurkerl pricing
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span className="t-label-xs">
                    Minimum · <span className="t-data-m" style={{ textTransform: "none", letterSpacing: 0 }}>€39.00</span>
                  </span>
                  <span className="t-data-m" style={{ color: met ? "var(--herb)" : "var(--paprika)" }}>
                    {money(plan.totalCents)} / €39.00
                  </span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${met ? "met" : ""}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <p className="t-body-s ink-soft mt-24" style={{ marginBottom: 0 }}>
                We&apos;ll sign in once, add everything to your Gurkerl cart, and you finish delivery and payment there.
              </p>

              <div className="mt-24">
                <button className="btn btn-primary" disabled={!met} onClick={() => setCheckoutOpen(true)} style={{ width: "100%" }}>
                  Add to Gurkerl cart <ArrowRight size={16} />
                </button>
              </div>
              <div className="mt-12">
                <Link className="btn btn-ghost" href="/plan/new/pick" style={{ width: "100%" }}>
                  Back to dinners
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {checkoutOpen && planId ? (
        <CheckoutModal plan={plan} planId={planId} onClose={() => setCheckoutOpen(false)} onSuccess={() => router.push(`/p/${planId}`)} />
      ) : null}
    </main>
  );
}

function CartLineRow({ item }: { item: CartItem }) {
  const dinnerLabel = formatDinnerLabel(item.recipes);
  return (
    <div className="basket-row">
      <div className="basket-row-main basket-row-main-with-photo">
        <div className="photo-ph basket-row-photo">
          <RecipeImage src={item.image} alt={item.productName} icon={<Basket size={24} />} />
        </div>
        <div className="basket-row-copy">
          <div className="t-body-m basket-row-title" style={{ fontWeight: 500 }}>
            {item.productName}
          </div>
          <div className="t-body-s ink-soft mt-6">
            {[item.brand || "Gurkerl", item.amount, item.recipes.length > 1 ? `shared across ${item.recipes.length} dinners` : null]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {dinnerLabel ? <div className="basket-row-usage mt-6">{dinnerLabel}</div> : null}
        </div>
      </div>
      <div className="basket-row-side">
        <div className="t-data-m">{money(item.subtotalCents)}</div>
        <a className="basket-row-link" href={item.link} target="_blank" rel="noreferrer">
          Open on Gurkerl
        </a>
      </div>
    </div>
  );
}

function SelectedExtraRow({ item, onToggle, busy }: { item: FillerItem; onToggle: () => void; busy: boolean }) {
  const meta = withFallbackMeta(item);
  return (
    <div className="basket-row">
      <div className="basket-row-main basket-row-main-with-photo">
        <div className="photo-ph basket-row-photo">
          <RecipeImage src={item.image} alt={item.productName} icon={<Basket size={24} />} />
        </div>
        <div className="basket-row-copy">
          <div className="t-body-m basket-row-title" style={{ fontWeight: 500 }}>
            {item.productName}
          </div>
          <div className="t-body-s ink-soft mt-6">
            {(item.amount || "1 item") + " · " + (meta.kind === "need" ? "from your note" : "optional extra")}
          </div>
        </div>
      </div>
      <div className="basket-row-side">
        <div className="t-data-m">{money(item.priceCents)}</div>
        <button className="basket-row-link" type="button" onClick={onToggle} disabled={busy}>
          {busy ? "Updating..." : "Remove"}
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({
  item,
  busy,
  onToggle
}: {
  item: FillerItem;
  busy: boolean;
  onToggle: () => void;
}) {
  const meta = withFallbackMeta(item);
  return (
    <motion.div
      className={`basket-suggestion-card ${item.selected ? "selected" : ""}`}
      initial={false}
      animate={{ y: item.selected ? -2 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="basket-suggestion-top">
        <div className="basket-suggestion-badges">
          <span className={`badge ${meta.kind === "need" ? "beet" : ""}`}>{meta.kind === "need" ? "From your note" : "Current deal"}</span>
          {meta.recommended ? <span className="badge herb">Best match</span> : null}
        </div>
        <div className="t-data-m basket-suggestion-price">{money(item.priceCents)}</div>
      </div>
      <div className="basket-suggestion-content">
        <div className="basket-suggestion-product">
          <div className="photo-ph basket-suggestion-media">
            <RecipeImage src={item.image} alt={item.productName} icon={<Basket size={26} />} />
          </div>
          <div className="basket-suggestion-copy">
            <div className="t-body-m basket-suggestion-title" style={{ fontWeight: 500 }}>
              {item.productName}
            </div>
            <div className="t-body-s ink-soft mt-4">{item.amount || "1 item"}</div>
          </div>
        </div>
        <p className="t-body-s ink-soft basket-suggestion-reason">{meta.reason}</p>
      </div>
      <div className="basket-suggestion-action">
        <button className={`btn ${item.selected ? "btn-outline" : "btn-primary"}`} style={{ width: "100%" }} onClick={onToggle} disabled={busy}>
          {busy ? "Updating..." : item.selected ? "Added" : "Add to cart"}
        </button>
      </div>
    </motion.div>
  );
}

function shortLabel(value: string): string {
  const words = value.split(" ").filter(Boolean);
  return words.slice(0, 3).join(" ");
}

function formatDinnerLabel(recipes: string[]): string {
  if (!recipes.length) return "";
  return `Used in ${recipes.map(shortLabel).join(" · ")}`;
}

function withFallbackMeta(item: FillerItem): Pick<FillerItem, "kind" | "reason" | "recommended"> {
  return {
    kind: item.kind ?? "topup",
    reason: item.reason || "Useful cart support item.",
    recommended: Boolean(item.recommended)
  };
}

type CheckoutMode = "regular" | "gurkerl";

function CheckoutModal({
  plan,
  planId,
  onClose,
  onSuccess
}: {
  plan: PlanRecord;
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<CheckoutMode>("gurkerl");
  const [showPw, setShowPw] = useState(false);
  const [gurkerlEmail, setGurkerlEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [regularEmail, setRegularEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const gurkerlReady = gurkerlEmail.includes("@") && password.length > 0;
  const regularReady =
    fullName.trim().length > 1 &&
    regularEmail.includes("@") &&
    phone.trim().length > 5 &&
    addressLine1.trim().length > 4 &&
    postalCode.trim().length > 2 &&
    city.trim().length > 1;
  const canSubmit = mode === "gurkerl" ? gurkerlReady : regularReady;

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const snapshot = {
        id: plan.id,
        totalCents: plan.totalCents,
        cart: plan.cart.map((item) => ({ productId: item.productId, qtyNeeded: item.qtyNeeded })),
        fillers: plan.fillers.map((item) => ({ productId: item.productId, selected: item.selected }))
      };
      const payload =
        mode === "gurkerl"
          ? { method: "gurkerl", email: gurkerlEmail.trim(), password, snapshot }
          : {
              method: "regular",
              fullName: fullName.trim(),
              email: regularEmail.trim(),
              phone: phone.trim(),
              addressLine1: addressLine1.trim(),
              postalCode: postalCode.trim(),
              city: city.trim(),
              notes: notes.trim(),
              snapshot
            };
      const response = await fetch(`/api/plan/${planId}/order`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (mode === "gurkerl" ? "Could not add the cart." : "Could not save details."));
      const nextPlan: PlanRecord = {
        ...plan,
        order:
          mode === "gurkerl"
            ? {
                method: "gurkerl",
                state: "cart",
                orderId: data.orderId ?? "gurkerl-cart",
                slotWindow: data.slotWindow ?? "Continue on Gurkerl to choose delivery and payment.",
                placedAt: new Date().toISOString()
              }
            : {
                method: "regular",
                state: "details",
                orderId: data.orderId ?? "regular-request",
                slotWindow: data.slotWindow ?? "We'll confirm the next step by email.",
                placedAt: new Date().toISOString(),
                customer: {
                  fullName: fullName.trim(),
                  email: regularEmail.trim(),
                  phone: phone.trim(),
                  addressLine1: addressLine1.trim(),
                  postalCode: postalCode.trim(),
                  city: city.trim(),
                  notes: notes.trim()
                }
              }
      };
      writeCachedPlan(nextPlan);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === "gurkerl" ? "Could not add the cart." : "Could not save details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div className="modal" onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <div className="checkout-modal-top">
          <span className="t-label-xs ink-soft">{mode === "gurkerl" ? "Add to cart" : "Save details"}</span>
          <h2 className="t-display-s mt-8" style={{ margin: 0 }}>
            {mode === "gurkerl" ? (
              <>
                Add this cart to <i>Gurkerl.</i>
              </>
            ) : (
              <>
                Save your <i>details.</i>
              </>
            )}
          </h2>
        </div>
        <div className="checkout-mode-switch mt-20" role="tablist" aria-label="Checkout type">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "regular"}
            className={`checkout-mode-option ${mode === "regular" ? "selected" : ""}`}
            onClick={() => {
              setMode("regular");
              setError("");
            }}
          >
            {mode === "regular" ? (
              <motion.span
                className="checkout-mode-indicator"
                layoutId="checkout-mode-indicator"
                transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
              />
            ) : null}
            <span className="checkout-mode-label">Regular</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "gurkerl"}
            aria-label="Gurkerl"
            className={`checkout-mode-option ${mode === "gurkerl" ? "selected" : ""}`}
            onClick={() => {
              setMode("gurkerl");
              setError("");
            }}
          >
            {mode === "gurkerl" ? (
              <motion.span
                className="checkout-mode-indicator"
                layoutId="checkout-mode-indicator"
                transition={{ type: "spring", duration: 0.42, bounce: 0.16 }}
              />
            ) : null}
            <Image
              className="checkout-mode-logo"
              src="/gurkerl-logo.svg"
              alt="Gurkerl.at"
              width={199}
              height={106}
            />
          </button>
        </div>
        <p className="t-body-s ink-soft mt-16 checkout-modal-copy">
          {mode === "gurkerl"
            ? "We add the items to your Gurkerl cart. You continue there to choose delivery and pay."
            : "We save your contact and delivery details first. Korbly follows up before anything is placed."}
        </p>
        {mode === "gurkerl" ? (
          <>
            <div className="mt-24">
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Gurkerl email
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@email.at"
                value={gurkerlEmail}
                onChange={(event) => setGurkerlEmail(event.target.value)}
              />
            </div>
            <div className="mt-16">
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Gurkerl password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPw ? "text" : "password"}
                  placeholder="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={{ paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "var(--ink-soft)", cursor: "pointer", fontSize: 12 }}
                >
                  {showPw ? "hide" : "show"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="checkout-form-grid mt-24">
            <div>
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Full name
              </label>
              <input className="input" type="text" placeholder="Alex Example" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div>
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Email
              </label>
              <input className="input" type="email" placeholder="you@email.at" value={regularEmail} onChange={(event) => setRegularEmail(event.target.value)} />
            </div>
            <div>
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Phone
              </label>
              <input className="input" type="tel" placeholder="+43 660 1234567" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="checkout-form-span-2">
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Street address
              </label>
              <input
                className="input"
                type="text"
                placeholder="Praterstrasse 10"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
              />
            </div>
            <div>
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Postal code
              </label>
              <input className="input" type="text" placeholder="1020" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
            </div>
            <div>
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                City
              </label>
              <input className="input" type="text" placeholder="Vienna" value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="checkout-form-span-2">
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>
                Delivery notes
              </label>
              <textarea
                className="textarea"
                placeholder="Doorbell name, stair info, or anything we should know."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
        )}
        <ErrorNote>{error}</ErrorNote>
        <button className="btn btn-primary mt-24" style={{ width: "100%" }} disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
                <Knife size={18} />
              </motion.span>
              {mode === "gurkerl" ? "Adding to cart..." : "Saving details..."}
            </span>
          ) : (
            mode === "gurkerl" ? "Add to Gurkerl cart" : "Save details"
          )}
        </button>
        <div className="t-label-xs ink-soft mt-16" style={{ textAlign: "center" }}>
          {mode === "gurkerl" ? "Korbly does not store your Gurkerl login" : "Saved to your Korbly plan"}
        </div>
      </motion.div>
    </div>
  );
}
