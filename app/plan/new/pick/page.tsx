"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Plate } from "@/components/icons";
import { ErrorNote, MiniNav, RecipeImage } from "@/components/shared";
import type { CandidateRecipe, IntakeInputs } from "@/lib/types";

const fallbackInputs: IntakeInputs = {
  householdSize: 2,
  dietFilters: [],
  allergyText: "",
  cuisines: ["Austrian"]
};

export default function PickPage() {
  const router = useRouter();
  const [inputs, setInputs] = useState<IntakeInputs>(fallbackInputs);
  const [candidates, setCandidates] = useState<CandidateRecipe[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedInputs = readJson<IntakeInputs>("korbly.inputs") ?? fallbackInputs;
    const storedCandidates = readJson<CandidateRecipe[]>("korbly.candidates");
    setInputs(storedInputs);
    if (storedCandidates?.length) {
      setCandidates(storedCandidates);
      setLoading(false);
    } else {
      void fetchCandidates(storedInputs);
    }
  }, []);

  async function fetchCandidates(nextInputs: IntakeInputs) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextInputs)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not fetch dinners.");
      setCandidates(data.candidates);
      sessionStorage.setItem("korbly.inputs", JSON.stringify(nextInputs));
      sessionStorage.setItem("korbly.candidates", JSON.stringify(data.candidates));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch dinners.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(recipeId: number) {
    setSelected((current) => {
      if (current.includes(recipeId)) return current.filter((id) => id !== recipeId);
      if (current.length >= 3) return current;
      return [...current, recipeId];
    });
  }

  async function buildCart() {
    if (selected.length !== 3) return;
    setBuilding(true);
    setError("");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ candidateIds: selected, inputs, candidates })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not build cart.");
      sessionStorage.setItem("korbly.planId", data.planId);
      router.push(`/plan/new/cart?planId=${data.planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build cart.");
    } finally {
      setBuilding(false);
    }
  }

  const count = selected.length;

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingBottom: 120 }}>
      <MiniNav step="pick" />
      <div style={{ position: "sticky", top: 68, zIndex: 40, background: "rgba(247,242,233,0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--rule)" }}>
        <div className="container" style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="t-label-xs ink-paprika">Step 2 of 3</span>
            <div className="t-display-s mt-4">
              Pick <i>three dinners.</i>
            </div>
          </div>
          <div>
            {count === 3 ? (
              <span className="badge beet">
                <Check size={12} /> 3 of 3
              </span>
            ) : (
              <span className="t-data-l">
                <span className={count > 0 ? "ink-paprika" : "ink-whisper"}>{count}</span>
                <span className="ink-whisper">/3</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "48px 32px" }}>
        <ErrorNote>{error}</ErrorNote>
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
            : candidates.map((recipe, index) => {
                const on = selected.includes(recipe.recipeId);
                return (
                  <motion.button
                    key={recipe.recipeId}
                    type="button"
                    className="card card-hover"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.28 }}
                    style={{
                      padding: 0,
                      cursor: "pointer",
                      border: on ? "2px solid var(--ink)" : "1px solid var(--rule)",
                      overflow: "hidden",
                      position: "relative",
                      textAlign: "left"
                    }}
                    onClick={() => toggle(recipe.recipeId)}
                  >
                    {on && (
                      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, width: 36, height: 36, borderRadius: 9999, background: "var(--ink)", display: "grid", placeItems: "center", color: "var(--paper)" }}>
                        <Check size={18} />
                      </div>
                    )}
                    <div className="photo-ph" style={{ aspectRatio: "3/2" }}>
                      <RecipeImage src={recipe.image} alt={recipe.title} icon={<Plate size={70} />} />
                    </div>
                    <div style={{ padding: 20 }}>
                      <h3 className="t-display-s" style={{ margin: 0 }}>
                        {recipe.title}
                      </h3>
                      <p className="t-body-s ink-soft mt-8" style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {recipe.description}
                      </p>
                      <div className="flex gap-12 mt-16" style={{ alignItems: "center", justifyContent: "space-between" }}>
                        <span className="t-data-m ink-soft" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Clock size={14} /> {recipe.timeMinutes} min
                        </span>
                        <span className="t-data-m ink-whisper">#{recipe.recipeId}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(247,242,233,0.92)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--rule)", padding: "18px 32px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <Link className="btn btn-ghost" href="/plan/new">
            ← Preferences
          </Link>
          <button className="btn btn-primary" disabled={count < 3 || building} onClick={buildCart}>
            {building ? "Building cart..." : "Build my cart"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="skeleton" style={{ aspectRatio: "3/2" }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 28, width: "80%", borderRadius: 8 }} />
        <div className="skeleton mt-12" style={{ height: 16, width: "100%", borderRadius: 8 }} />
        <div className="skeleton mt-16" style={{ height: 18, width: "40%", borderRadius: 8 }} />
      </div>
    </div>
  );
}

function readJson<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}
