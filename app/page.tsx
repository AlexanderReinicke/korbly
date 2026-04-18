import Link from "next/link";
import { ArrowRight, Basket, CargoBike, Check, ICON_FRIEZE, Knife, Parsley, Wine } from "@/components/icons";

const receiptRows = [
  ["Gurkerl recipes", "3 dinners", "real IDs"],
  ["Ingredients", "deduped", "one cart"],
  ["Minimum", "€39", "checked"],
  ["Plan URL", "saved", "cook later"]
];

export default function LandingPage() {
  return (
    <main className="paper-grain" style={{ minHeight: "100vh" }}>
      <Topbar />
      <section className="container" style={{ paddingTop: 72, paddingBottom: 48 }}>
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 32, alignItems: "end" }}>
          <div style={{ gridColumn: "1 / span 7" }}>
            <div className="flex gap-12" style={{ alignItems: "center", marginBottom: 32, flexWrap: "wrap" }}>
              <span className="badge outline">Vienna · 1010-1230</span>
              <span className="t-body-s ink-soft">
                Delivered by <span style={{ color: "var(--ink)" }}>Gurkerl</span>
              </span>
            </div>
            <h1 className="t-display-xxl" style={{ margin: 0 }}>
              Three <i>dinners,</i>
              <br />
              one cart,
              <br />
              zero admin.
            </h1>
          </div>
          <div style={{ gridColumn: "8 / span 5", paddingBottom: 10 }}>
            <p className="t-body-l ink-soft" style={{ margin: 0 }}>
              Korbly turns three recipes into one Gurkerl order - ingredients deduped, amounts solved, delivery
              booked. A plan you can actually cook from.
            </p>
            <div className="flex gap-16 mt-24" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-primary" href="/plan/new">
                Plan my week <ArrowRight size={16} />
              </Link>
              <a href="#menu" className="t-body-s ink-soft ul">
                Browse the idea
              </a>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "32px 0 64px" }}>
        <div className="container">
          <div className="card" style={{ background: "var(--surface)", padding: "28px 0", overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
                alignItems: "center",
                justifyItems: "center",
                color: "var(--ink)"
              }}
            >
              {ICON_FRIEZE.map((Icon, index) => (
                <div key={index} style={{ display: "grid", placeItems: "center", gap: 10, padding: "12px 0" }}>
                  <Icon size={40} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="container" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 32 }}>
          <div style={{ gridColumn: "1 / span 4" }}>
            <span className="t-label-xs ink-paprika">How</span>
            <h2 className="t-display-l mt-12" style={{ margin: 0 }}>
              Three steps. One minute.
            </h2>
            <p className="t-body-m ink-soft mt-16">
              No app, no subscription. Pay Gurkerl&apos;s prices. They handle delivery; we handle the thinking.
            </p>
          </div>
          <div style={{ gridColumn: "6 / span 7" }}>
            <IndexRow n="01" k="Pick three dinners" v="from six Gurkerl recipes" />
            <IndexRow n="02" k="We consolidate the cart" v="real Gurkerl SKUs, no duplicates" />
            <IndexRow n="03" k="Gurkerl delivers" v="you keep the plan URL for cooking" />
            <div style={{ borderTop: "1px solid var(--rule)" }} />
          </div>
        </div>
      </section>

      <section id="menu" style={{ background: "var(--paper-deep)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
        <div className="container" style={{ padding: "96px 32px" }}>
          <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 48, alignItems: "start" }}>
            <div style={{ gridColumn: "1 / span 5" }}>
              <span className="t-label-xs ink-paprika">This week</span>
              <h2 className="t-display-l mt-12" style={{ margin: 0 }}>
                A sample cart,
                <br />
                <i>solved in real-time.</i>
              </h2>
              <p className="t-body-m ink-soft mt-24" style={{ maxWidth: 420 }}>
                Three dinners for the week, consolidated into a single Gurkerl order. No duplicate parsley, no
                leftover breadcrumbs, no recipe generation.
              </p>
              <div className="kv mt-32" style={{ maxWidth: 420 }}>
                <div className="k">Dinners</div>
                <div className="v">3</div>
                <div className="k">Servings</div>
                <div className="v">2, 3, or 4</div>
                <div className="k">Minimum</div>
                <div className="v">Gurkerl&apos;s €39 rule</div>
                <div className="k">Delivery</div>
                <div className="v">next available Gurkerl slot</div>
              </div>
            </div>
            <div style={{ gridColumn: "7 / span 6" }}>
              <ReceiptBuilder />
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "48px 0", borderBottom: "1px solid var(--rule)", overflow: "hidden" }}>
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} style={{ display: "flex", gap: 64, alignItems: "center" }}>
              {[
                ["No subscription", Knife],
                ["Real Gurkerl SKUs", Basket],
                ["Gurkerl delivery", CargoBike],
                ["Permanent plan URL", Parsley],
                ["€39 minimum, handled", Wine]
              ].map(([label, Icon], index) => (
                <div key={`${group}-${index}`} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Icon size={28} />
                  <span className="t-display-m">{String(label)}</span>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: "var(--paprika)" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="container" style={{ padding: "128px 32px" }}>
          <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 32, alignItems: "end" }}>
            <div style={{ gridColumn: "1 / span 7" }}>
              <h2 className="t-display-xxl" style={{ margin: 0, color: "var(--paper)" }}>
                Start your <i>week.</i>
              </h2>
            </div>
            <div style={{ gridColumn: "8 / span 5", paddingBottom: 12 }}>
              <p className="t-body-l" style={{ color: "var(--paper)", opacity: 0.7, margin: 0 }}>
                One minute of intake. Three dinners. One cart. Delivered by Gurkerl.
              </p>
              <div className="mt-24">
                <Link className="btn" style={{ background: "var(--paprika)", borderColor: "var(--paprika)", color: "var(--paper)" }} href="/plan/new">
                  Plan my week <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="container" style={{ padding: "48px 32px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div className="flex gap-12" style={{ alignItems: "center" }}>
            <div className="kmark" style={{ width: 24, height: 24, fontSize: 16 }}>
              K
            </div>
            <span className="t-body-s ink-soft">Korbly - Wien 1070.</span>
          </div>
          <div className="t-body-s ink-soft">Delivered by Gurkerl. Vienna only. Credentials are used once at checkout.</div>
        </div>
      </footer>
    </main>
  );
}

function Topbar() {
  return (
    <div className="topnav">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="kmark">K</div>
          <span className="t-display-s">Korbly</span>
        </Link>
        <div className="flex gap-24 mobile-hide" style={{ alignItems: "center" }}>
          <a className="t-body-s ink-soft" href="#how">
            How
          </a>
          <a className="t-body-s ink-soft" href="#menu">
            This week
          </a>
          <Link className="btn btn-primary" href="/plan/new" style={{ padding: "10px 18px" }}>
            Plan my week
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReceiptBuilder() {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--surface)" }}>
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--rule)" }}>
        <div className="flex gap-12" style={{ alignItems: "center" }}>
          <span className="badge herb">
            <Check size={12} /> Live cart
          </span>
          <span className="t-body-s ink-soft">3 dinners</span>
        </div>
        <span className="t-data-m ink-soft">v0</span>
      </div>
      <div style={{ padding: "8px 8px" }}>
        {receiptRows.map(([title, amount, price], index) => (
          <div
            key={title}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr auto auto",
              gap: 12,
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: index < receiptRows.length - 1 ? "1px solid var(--rule)" : "none"
            }}
          >
            <Basket size={22} />
            <span className="t-body-s">{title}</span>
            <span className="t-data-m ink-soft" style={{ fontSize: 12 }}>
              {amount}
            </span>
            <span className="t-data-m">{price}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "baseline", background: "var(--paper)" }}>
        <span className="t-label-xs ink-soft">Total</span>
        <span className="t-data-l">shown before checkout</span>
      </div>
    </div>
  );
}

function IndexRow({ n, k, v }: { n: string; k: string; v: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 20, alignItems: "baseline", padding: "20px 0", borderTop: "1px solid var(--rule)" }}>
      <span className="t-data-m ink-whisper">{n}</span>
      <span className="t-display-s">{k}</span>
      <span className="t-body-s ink-soft">{v}</span>
    </div>
  );
}
