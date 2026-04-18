"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import { ErrorNote, MiniNav } from "@/components/shared";
import { CUISINES, DIET_FILTERS, type Cuisine, type DietFilter, type IntakeInputs } from "@/lib/types";

const defaultInputs: IntakeInputs = {
  householdSize: 2,
  dietFilters: [],
  allergyText: "",
  needText: "",
  cuisines: ["Austrian"]
};

const householdOptions: Array<{ value: IntakeInputs["householdSize"]; label: string; detail: string }> = [
  { value: 2, label: "Two people", detail: "Weeknight dinners sized for a pair." },
  { value: 3, label: "Three people", detail: "A small table with a little stretch." },
  { value: 4, label: "Four people", detail: "Family-style portions and fewer top-ups." }
];

export default function IntakePage() {
  const router = useRouter();
  const [state, setState] = useState<IntakeInputs>(defaultInputs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedInputs = readJson<Partial<IntakeInputs>>("korbly.inputs") ?? {};
    const params = new URLSearchParams(window.location.search);
    const household = Number(params.get("household"));
    const needText = params.get("need")?.trim() ?? "";
    const cuisines = params
      .get("cuisines")
      ?.split(",")
      .map((item) => item.trim())
      .filter((item): item is Cuisine => (CUISINES as readonly string[]).includes(item));
    setState({
      ...defaultInputs,
      ...storedInputs,
      householdSize: [2, 3, 4].includes(household)
        ? (household as 2 | 3 | 4)
        : (storedInputs.householdSize ?? defaultInputs.householdSize),
      needText: needText || storedInputs.needText || defaultInputs.needText,
      cuisines: cuisines?.length ? cuisines : storedInputs.cuisines?.length ? storedInputs.cuisines : defaultInputs.cuisines
    });
  }, []);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not fetch dinners.");
      sessionStorage.setItem("korbly.inputs", JSON.stringify(state));
      sessionStorage.setItem("korbly.candidates", JSON.stringify(data.candidates));
      router.push("/plan/new/pick");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch dinners.");
    } finally {
      setLoading(false);
    }
  }

  function toggleDiet(value: DietFilter) {
    setState((current) => ({
      ...current,
      dietFilters: current.dietFilters.includes(value)
        ? current.dietFilters.filter((item) => item !== value)
        : [...current.dietFilters, value]
    }));
  }

  function toggleCuisine(value: Cuisine) {
    setState((current) => ({
      ...current,
      cuisines: current.cuisines.includes(value)
        ? current.cuisines.filter((item) => item !== value)
        : [...current.cuisines, value]
    }));
  }

  const trimmedAllergyText = state.allergyText.trim();
  const activeLimits = state.dietFilters.length + (trimmedAllergyText ? 1 : 0);
  const cuisineReady = state.cuisines.length > 0;
  const restrictionsSummary = activeLimits
    ? [...state.dietFilters, ...(trimmedAllergyText ? [trimmedAllergyText] : [])].join(" · ")
    : "Open to anything";

  return (
    <main className="paper-grain intake-page" style={{ minHeight: "100vh" }}>
      <MiniNav step="intake" />
      <div className="intake-stage intake-stage-compact">
        <div className="container">
          <motion.section
            className="intake-form-shell intake-form-shell-compact"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            <div className="intake-form-header intake-form-header-compact">
              <div>
                <span className="t-label-xs ink-paprika">Step 1 of 3</span>
                <h1 className="t-display-m intake-page-title mt-8" style={{ margin: 0 }}>
                  What do you need?
                </h1>
              </div>
            </div>

            <div className="intake-compact-grid">
              <section className="intake-panel intake-panel-note">
                <div className="intake-panel-head">
                  <label className="intake-panel-title" htmlFor="need-text">
                    Need
                  </label>
                  <span className="t-data-m ink-whisper">{state.needText.length}/600</span>
                </div>
                <textarea
                  id="need-text"
                  className="textarea intake-textarea intake-textarea-compact"
                  rows={3}
                  maxLength={600}
                  placeholder="Weeknight dinners, pantry top-up, guests, easy lunches..."
                  value={state.needText}
                  onChange={(event) => setState({ ...state, needText: event.target.value })}
                />
              </section>

              <section className="intake-panel intake-panel-household">
                <div className="intake-panel-head">
                  <span className="intake-panel-title">Cooking for</span>
                </div>
                <div className="intake-choice-grid intake-choice-grid-compact">
                  {householdOptions.map((option) => {
                    const selected = state.householdSize === option.value;

                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        className={`intake-choice intake-choice-compact ${selected ? "selected" : ""}`}
                        aria-pressed={selected}
                        onClick={() => setState({ ...state, householdSize: option.value })}
                        whileTap={{ scale: 0.985 }}
                      >
                        <span className="intake-choice-value">{option.value}</span>
                        <span className="intake-choice-detail">{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              <section className="intake-panel intake-panel-limits">
                <div className="intake-panel-head">
                  <label className="intake-panel-title" htmlFor="allergy-text">
                    Off-limits
                  </label>
                  <span className="t-body-s ink-soft">{restrictionsSummary}</span>
                </div>
                <div className="intake-chip-row intake-chip-row-compact">
                  {DIET_FILTERS.map((filter) => {
                    const selected = state.dietFilters.includes(filter);

                    return (
                      <motion.button
                        key={filter}
                        type="button"
                        className={`intake-chip ${selected ? "selected" : ""}`}
                        aria-pressed={selected}
                        onClick={() => toggleDiet(filter)}
                        whileTap={{ scale: 0.97 }}
                      >
                        {filter}
                      </motion.button>
                    );
                  })}
                </div>

                <input
                  id="allergy-text"
                  className="input intake-inline-input intake-inline-input-compact"
                  placeholder="Anything else to avoid?"
                  value={state.allergyText}
                  onChange={(event) => setState({ ...state, allergyText: event.target.value })}
                />
              </section>

              <section className="intake-panel intake-panel-tastes">
                <div className="intake-panel-head">
                  <span className="intake-panel-title">Tastes</span>
                  <span className="t-body-s ink-soft">{cuisineReady ? `${state.cuisines.length} selected` : "Pick at least one"}</span>
                </div>
                <div className="intake-chip-row intake-chip-row-compact">
                  {CUISINES.map((cuisine) => {
                    const selected = state.cuisines.includes(cuisine);

                    return (
                      <motion.button
                        key={cuisine}
                        type="button"
                        className={`intake-chip taste ${selected ? "selected" : ""}`}
                        aria-pressed={selected}
                        onClick={() => toggleCuisine(cuisine)}
                        whileTap={{ scale: 0.97 }}
                      >
                        {cuisine}
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            </div>

            <ErrorNote>{error}</ErrorNote>

            <div className="intake-actions intake-actions-compact">
              <p className="t-body-s ink-soft" style={{ margin: 0 }}>
                {cuisineReady ? "€39 minimum handled. We show the total before checkout." : "Pick at least one taste to continue."}
              </p>
              <button className="btn btn-primary intake-submit" onClick={submit} disabled={loading || !cuisineReady}>
                {loading ? "Finding dinners..." : "Show me dinners"} <ArrowRight size={16} />
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
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
