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

  return (
    <main className="paper-grain" style={{ minHeight: "100vh" }}>
      <MiniNav step="intake" />
      <div className="container-card" style={{ padding: "96px 24px" }}>
        <span className="t-label-xs ink-paprika">Step 1 of 3</span>
        <h1 className="t-display-l mt-12" style={{ margin: 0 }}>
          How do you <i>eat?</i>
        </h1>
        <p className="t-body-m ink-soft mt-12">One minute. We use this to pick six dinners you&apos;d actually cook.</p>

        <div className="mt-40">
          <div className="t-label-xs mb-16">Tell us what you need</div>
          <textarea
            className="textarea"
            rows={4}
            maxLength={600}
            placeholder="Weeknight dinners for two, easy lunches, snacks for guests, not too spicy, pantry top-up..."
            value={state.needText}
            onChange={(event) => setState({ ...state, needText: event.target.value })}
          />
          <p className="t-body-s ink-soft mt-12">
            Optional. Share the shape of the week and we&apos;ll use it alongside your filters and cuisines.
          </p>
        </div>

        <div className="mt-48">
          <div className="t-label-xs mb-16">Cooking for</div>
          <div className="flex gap-12" style={{ flexWrap: "wrap" }}>
            {[2, 3, 4].map((n) => (
              <motion.button
                key={n}
                type="button"
                className={`pill ${state.householdSize === n ? "selected" : ""}`}
                onClick={() => setState({ ...state, householdSize: n as 2 | 3 | 4 })}
                whileTap={{ scale: 0.96 }}
              >
                <span className="t-data-m" style={{ marginRight: 6 }}>
                  {n}
                </span>
                {n === 2 ? "two" : n === 3 ? "three" : "four"}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mt-48">
          <div className="t-label-xs mb-16">Anything off-limits?</div>
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
            {DIET_FILTERS.map((filter) => {
              const selected = state.dietFilters.includes(filter);
              return (
                <motion.button
                  key={filter}
                  type="button"
                  className={`chip ${selected ? "selected" : ""}`}
                  onClick={() => toggleDiet(filter)}
                  whileTap={{ scale: 0.95 }}
                >
                  {filter}
                </motion.button>
              );
            })}
          </div>
          <input
            className="input mt-16"
            placeholder="Anything else to avoid? (e.g. cilantro, liver)"
            value={state.allergyText}
            onChange={(event) => setState({ ...state, allergyText: event.target.value })}
          />
        </div>

        <div className="mt-48">
          <div className="t-label-xs mb-16">Feeling</div>
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
            {CUISINES.map((cuisine) => {
              const selected = state.cuisines.includes(cuisine);
              return (
                <motion.button
                  key={cuisine}
                  type="button"
                  className={`chip ${selected ? "selected-saffron" : ""}`}
                  onClick={() => toggleCuisine(cuisine)}
                  whileTap={{ scale: 0.95 }}
                >
                  {cuisine}
                </motion.button>
              );
            })}
          </div>
        </div>

        <p className="t-body-s ink-soft mt-32">
          Gurkerl minimum order <span className="t-data-m">€39</span>. We&apos;ll show the running total before you
          check out and suggest neutral add-ons if you&apos;re under.
        </p>
        <ErrorNote>{error}</ErrorNote>
        <div className="mt-32">
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading || state.cuisines.length === 0}>
            {loading ? "Finding dinners..." : "Show me dinners"} <ArrowRight size={16} />
          </button>
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
