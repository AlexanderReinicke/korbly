"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Basket, Knife, Plate } from "@/components/icons";
import { ErrorNote, MiniNav, RecipeImage, money } from "@/components/shared";
import type { FillerItem, PlanRecord } from "@/lib/types";

export function CartClient({ initialPlanId }: { initialPlanId: string | null }) {
  const router = useRouter();
  const [planId, setPlanId] = useState(initialPlanId);
  const [plan, setPlan] = useState<PlanRecord | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = initialPlanId ?? sessionStorage.getItem("korbly.planId");
    setPlanId(id);
    if (!id) {
      setLoading(false);
      setError("No plan ID found. Build a cart from three dinners first.");
      return;
    }
    void fetchPlan(id);
  }, [initialPlanId]);

  async function fetchPlan(id: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/plan/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Plan not found.");
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan not found.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFiller(item: FillerItem) {
    if (!planId) return;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cart.");
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
          <div className="skeleton mt-32" style={{ height: 360, borderRadius: 12 }} />
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

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <MiniNav step="cart" />
      <div className="container" style={{ padding: "64px 32px 96px" }}>
        <span className="t-label-xs ink-paprika">Step 3 of 3</span>
        <h1 className="t-display-l mt-12" style={{ margin: 0 }}>
          Your <i>three dinners,</i> one cart.
        </h1>
        <p className="t-body-m ink-soft mt-12">Consolidated into real Gurkerl SKUs. No duplicate parsley.</p>

        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginTop: 40 }}>
          {plan.recipes.map((recipe) => (
            <div key={recipe.recipeId} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <div className="photo-ph" style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8 }}>
                <RecipeImage src={recipe.image} alt={recipe.title} icon={<Plate size={34} />} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-display-s" style={{ lineHeight: 1.1, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {recipe.title}
                </div>
                <div className="t-body-s ink-soft mt-4">
                  {recipe.ingredients.length} items · {recipe.timeMinutes} min
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span className="t-label-xs">
              Gurkerl minimum · <span className="t-data-m" style={{ textTransform: "none", letterSpacing: 0 }}>€39.00</span>
            </span>
            <span className="t-data-m" style={{ color: met ? "var(--herb)" : "var(--paprika)" }}>
              {money(plan.totalCents)} / €39.00
            </span>
          </div>
          <div className="progress-track">
            <div className={`progress-fill ${met ? "met" : ""}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="card mt-32" style={{ padding: 20 }}>
          <div className="cart-table-wrap">
            <table className="cart-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}></th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Qty needed</th>
                  <th>Used in</th>
                  <th className="right">Unit</th>
                  <th className="right">Subtotal</th>
                  <th style={{ width: 48 }}></th>
                </tr>
              </thead>
              <tbody>
                {plan.cart.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="ill-circle">
                        {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Basket size={20} />}
                      </div>
                    </td>
                    <td>
                      <div className="t-body-m" style={{ fontWeight: 500 }}>{item.productName}</div>
                      <div className="t-body-s ink-soft">{item.brand || "Gurkerl"}</div>
                    </td>
                    <td className="t-body-s ink-soft">{item.amount}</td>
                    <td className="t-data-m">{item.qtyNeeded}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.recipes.map((recipe) => (
                          <span key={recipe} className="badge" style={{ fontSize: 10, padding: "3px 8px" }}>
                            {recipe.split(" ").slice(0, 2).join(" ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="right t-data-m">{money(item.unitPriceCents)}</td>
                    <td className="right t-data-m" style={{ fontWeight: 500 }}>{money(item.subtotalCents)}</td>
                    <td className="right">
                      <a className="ink-whisper" href={item.link} target="_blank" rel="noreferrer" aria-label={`Open ${item.productName} on Gurkerl`}>
                        ↗
                      </a>
                    </td>
                  </tr>
                ))}
                {plan.fillers.filter((item) => item.selected).map((item) => (
                  <tr key={`filler-${item.productId}`} style={{ background: "var(--paper)" }}>
                    <td>
                      <div className="ill-circle">
                        {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Basket size={20} />}
                      </div>
                    </td>
                    <td>
                      <div className="t-body-m" style={{ fontWeight: 500 }}>{item.productName}</div>
                      <div className="t-body-s ink-soft">added by you</div>
                    </td>
                    <td className="t-body-s ink-soft">{item.amount}</td>
                    <td className="t-data-m">1</td>
                    <td><span className="t-body-s ink-whisper">-</span></td>
                    <td className="right t-data-m">{money(item.priceCents)}</td>
                    <td className="right t-data-m" style={{ fontWeight: 500 }}>{money(item.priceCents)}</td>
                    <td className="right">
                      <button style={{ background: "none", border: 0, color: "var(--ink-soft)", cursor: "pointer" }} onClick={() => toggleFiller(item)}>
                        x
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} style={{ borderBottom: "none", paddingTop: 24 }}>
                    <span className="t-label-xs ink-soft">Total · {plan.cart.length + plan.fillers.filter((item) => item.selected).length} items</span>
                  </td>
                  <td className="right" style={{ borderBottom: "none", paddingTop: 24 }}>
                    <span className="t-label-xs ink-soft">3 dinners</span>
                  </td>
                  <td className="right" style={{ borderBottom: "none", paddingTop: 24 }}>
                    <span className="t-data-l" style={{ color: met ? "var(--herb)" : "var(--ink)" }}>{money(plan.totalCents)}</span>
                  </td>
                  <td style={{ borderBottom: "none" }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {!met && (
          <div className="mt-48">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
              <div className="t-display-s">Add to reach €39</div>
              <div className="t-body-s ink-soft">
                You&apos;re <span className="t-data-m">{money(3900 - plan.totalCents)}</span> short. Gurkerl requires a €39 minimum order.
              </div>
            </div>
            <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
              {plan.fillers.map((item) => (
                <div key={item.productId} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="photo-ph" style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0 }}>
                    <RecipeImage src={item.image} alt={item.productName} icon={<Basket size={28} />} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-body-m" style={{ fontWeight: 500 }}>{item.productName}</div>
                    <div className="t-body-s ink-soft">
                      {item.amount} · <span className="t-data-m">{money(item.priceCents)}</span>
                    </div>
                  </div>
                  <button className={`btn ${item.selected ? "btn-outline" : "btn-primary"}`} style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => toggleFiller(item)} disabled={updating === item.productId}>
                    {item.selected ? "Added" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ErrorNote>{error}</ErrorNote>
        <div className="mt-64">
          <p className="t-body-s ink-soft mb-16" style={{ textAlign: "right" }}>
            We&apos;ll ask for your Gurkerl login next. We never store your credentials.
          </p>
          <div className="flex gap-16" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-ghost" href="/plan/new/pick">
              ← Back to dinners
            </Link>
            <button className="btn btn-primary" disabled={!met} onClick={() => setCheckoutOpen(true)}>
              Place order with Gurkerl <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      {checkoutOpen && planId ? (
        <CheckoutModal planId={planId} onClose={() => setCheckoutOpen(false)} onSuccess={() => router.push(`/p/${planId}`)} />
      ) : null}
    </main>
  );
}

function CheckoutModal({ planId, onClose, onSuccess }: { planId: string; onClose: () => void; onSuccess: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailMe, setEmailMe] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = email.includes("@") && password.length > 0;

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/plan/${planId}/order`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, emailMe })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not place order.");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div className="modal" onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <span className="t-label-xs ink-soft">Secure checkout</span>
        <h2 className="t-display-m mt-8" style={{ margin: 0 }}>
          One step <i>left.</i>
        </h2>
        <p className="t-body-m ink-soft mt-16">We&apos;ll use your Gurkerl login once to place this order, then forget it.</p>
        <div className="mt-24">
          <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>Gurkerl email</label>
          <input className="input" type="email" placeholder="you@email.at" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="mt-16">
          <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>Gurkerl password</label>
          <div style={{ position: "relative" }}>
            <input className="input" type={showPw ? "text" : "password"} placeholder="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ paddingRight: 56 }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "var(--ink-soft)", cursor: "pointer", fontSize: 12 }}>
              {showPw ? "hide" : "show"}
            </button>
          </div>
        </div>
        <div className="mt-16">
          {!showEmail ? (
            <button type="button" onClick={() => setShowEmail(true)} className="t-body-s ink-soft" style={{ background: "none", border: 0, cursor: "pointer", padding: 0, borderBottom: "1px solid var(--rule-strong)" }}>
              Email me this plan →
            </button>
          ) : (
            <div>
              <label className="t-label-xs ink-soft" style={{ display: "block", marginBottom: 8 }}>Where should we send it?</label>
              <input className="input" type="email" placeholder="you@email.at" value={emailMe} onChange={(event) => setEmailMe(event.target.value)} />
            </div>
          )}
        </div>
        <ErrorNote>{error}</ErrorNote>
        <button className="btn btn-primary mt-24" style={{ width: "100%" }} disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
                <Knife size={18} />
              </motion.span>
              Placing order...
            </span>
          ) : (
            "Place order"
          )}
        </button>
        <div className="t-label-xs ink-soft mt-16" style={{ textAlign: "center" }}>
          Secured by Gurkerl · Not stored by Korbly
        </div>
      </motion.div>
    </div>
  );
}
