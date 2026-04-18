import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Basket,
  CargoBike,
  Check,
  Garlic,
  Knife,
  Paprika,
  Parsley,
  Wine
} from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";

const sampleMeals = [
  "Paprika chicken",
  "Lemon parsley pasta",
  "Shakshuka toast"
] as const;

const sampleCartItems = [
  { name: "Garlic", amount: "1 bulb", overlap: "3 meals", Icon: Garlic },
  { name: "Flat-leaf parsley", amount: "1 bunch", overlap: "2 meals", Icon: Parsley },
  { name: "Red peppers", amount: "3 pcs", overlap: "2 meals", Icon: Paprika }
] as const;

const hiddenCartItems = 6;

const marqueeItems = [
  ["No subscription", Knife],
  ["Real products", Basket],
  ["Delivered from 3 hours", CargoBike],
  ["Permanent plan URL", Parsley],
  ["€39 minimum, handled", Wine]
] as const;

const heroRainItems = [
  {
    src: "/hero-fruits/apple.png",
    left: "-1%",
    top: "6%",
    size: 112,
    rotate: "-14deg",
    duration: "24s",
    delay: "-6s",
    motion: "a",
    opacity: 0.11,
    mobileHidden: true
  },
  {
    src: "/hero-fruits/orange-wedge.png",
    left: "34%",
    top: "5%",
    size: 100,
    rotate: "10deg",
    duration: "22s",
    delay: "-13s",
    motion: "c",
    opacity: 0.1,
    mobileHidden: false
  },
  {
    src: "/hero-fruits/orange-whole.png",
    left: "73%",
    top: "4%",
    size: 128,
    rotate: "12deg",
    duration: "25s",
    delay: "-9s",
    motion: "c",
    opacity: 0.13,
    mobileHidden: false
  },
  {
    src: "/hero-fruits/lemon-half.png",
    left: "7%",
    top: "40%",
    size: 122,
    rotate: "-20deg",
    duration: "26s",
    delay: "-16s",
    motion: "b",
    opacity: 0.12,
    mobileHidden: false
  },
  {
    src: "/hero-fruits/kiwi-slice.png",
    left: "39%",
    top: "39%",
    size: 106,
    rotate: "8deg",
    duration: "23s",
    delay: "-10s",
    motion: "a",
    opacity: 0.1,
    mobileHidden: true
  },
  {
    src: "/hero-fruits/strawberry.png",
    left: "82%",
    top: "37%",
    size: 98,
    rotate: "-6deg",
    duration: "24s",
    delay: "-7s",
    motion: "b",
    opacity: 0.11,
    mobileHidden: true
  },
  {
    src: "/hero-fruits/watermelon-slice.png",
    left: "13%",
    top: "71%",
    size: 120,
    rotate: "-14deg",
    duration: "22s",
    delay: "-3s",
    motion: "a",
    opacity: 0.11,
    mobileHidden: false
  },
  {
    src: "/hero-fruits/peach-half.png",
    left: "45%",
    top: "70%",
    size: 102,
    rotate: "4deg",
    duration: "27s",
    delay: "-12s",
    motion: "c",
    opacity: 0.1,
    mobileHidden: true
  },
  {
    src: "/hero-fruits/pear.png",
    left: "78%",
    top: "67%",
    size: 128,
    rotate: "9deg",
    duration: "24s",
    delay: "-5s",
    motion: "b",
    opacity: 0.13,
    mobileHidden: false
  }
] as const;

export default function LandingPage() {
  return (
    <main className="paper-grain" style={{ minHeight: "100vh" }}>
      <Topbar />
      <section className="hero-stage">
        <HeroRainBackdrop />
        <div className="container" style={{ paddingTop: 72, paddingBottom: 56 }}>
          <div className="mobile-stack hero-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 32, alignItems: "center" }}>
            <div className="hero-copy" style={{ gridColumn: "1 / span 8" }}>
              <h1 className="t-display-xxl hero-title" style={{ margin: 0 }}>
                <span className="hero-title-line">Tell us what</span>
                <span className="hero-title-line">
                  you <i>eat.</i>
                </span>
                <span className="hero-title-line">Delivered.</span>
              </h1>
              <form action="/plan/new" method="get" className="hero-need-form">
                <label className="sr-only" htmlFor="hero-need">
                  Tell us what you need
                </label>
                <input
                  id="hero-need"
                  name="need"
                  className="input hero-need-input"
                  maxLength={240}
                  placeholder="meals, basics or snacks"
                  aria-label="Tell us what you need"
                />
                <button className="btn btn-primary hero-need-submit" type="submit">
                  Build my order <ArrowRight size={16} />
                </button>
              </form>
            </div>
            <div className="hero-support" style={{ gridColumn: "9 / span 4" }}>
              <div className="partner-imprint partner-imprint-hero">
                <span className="t-label-xs partner-imprint-label">Delivered with</span>
                <div className="partner-imprint-lockup">
                  <Image
                    className="partner-imprint-logo"
                    src="/gurkerl-logo.svg"
                    alt="Gurkerl.at"
                    width={199}
                    height={106}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="container" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 32 }}>
          <div style={{ gridColumn: "1 / span 4" }}>
            <h2 className="t-display-l" style={{ margin: 0 }}>
              Three steps.
            </h2>
            <p className="t-body-m ink-soft mt-16">
              No app, no subscription. Pay the partner&apos;s prices. They handle delivery; we handle the thinking.
            </p>
          </div>
          <div style={{ gridColumn: "6 / span 7" }}>
            <IndexRow n="01" k="Say what you need" v="meals, basics, snacks, or quick setup" />
            <IndexRow n="02" k="Korbly builds the cart" v="real products, deduped, minimums checked" />
            <IndexRow n="03" k="Gurkerl delivers" v="from 3 hours · keep the plan URL" />
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
                Three dinners,
                <br />
                <i>one cart.</i>
              </h2>
              <p className="t-body-m ink-soft mt-24" style={{ maxWidth: 420 }}>
                Pick meals for the week. Korbly merges the overlapping groceries into one Gurkerl order.
              </p>
              <div className="kv mt-32" style={{ maxWidth: 420 }}>
                <div className="k">Meals</div>
                <div className="v">3 dinners</div>
                <div className="k">Serves</div>
                <div className="v">2 to 4 people</div>
                <div className="k">Minimum</div>
                <div className="v">€39 handled</div>
                <div className="k">Delivery</div>
                <div className="v">next Gurkerl slot</div>
              </div>
            </div>
            <div style={{ gridColumn: "7 / span 6" }}>
              <CartPreview />
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "48px 0", borderBottom: "1px solid var(--rule)", overflow: "hidden" }}>
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, group) => (
            <div key={group} className="marquee-group">
              {marqueeItems.flatMap(([label, Icon], index) => [
                <div key={`item-${group}-${index}`} className="marquee-item">
                  <Icon size={28} />
                  <span className="t-display-m">{label}</span>
                </div>,
                <span key={`separator-${group}-${index}`} className="marquee-separator" aria-hidden="true" />
              ])}
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="container" style={{ padding: "128px 32px" }}>
          <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 32, alignItems: "end" }}>
            <div style={{ gridColumn: "1 / span 7" }}>
              <h2 className="t-display-xxl" style={{ margin: 0, color: "var(--paper)" }}>
                Say the <i>need.</i>
              </h2>
            </div>
            <div style={{ gridColumn: "8 / span 5", paddingBottom: 12 }}>
              <p className="t-body-l" style={{ color: "var(--paper)", opacity: 0.7, margin: 0 }}>
                A real grocery order. Delivered through Gurkerl from 3 hours.
              </p>
              <div className="mt-24">
                <Link className="btn" style={{ background: "var(--paprika)", borderColor: "var(--paprika)", color: "var(--paper)" }} href="/plan/new">
                  Build my order <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Topbar() {
  return (
    <div className="topnav">
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
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
            Build my order
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeroRainBackdrop() {
  return (
    <div className="hero-rain" aria-hidden="true">
      {heroRainItems.map(({ src, left, top, size, rotate, duration, delay, motion, opacity, mobileHidden }, index) => {
        const wrapperStyle: CSSProperties = {
          left,
          top,
          width: size,
          height: size,
          animationDuration: duration,
          animationDelay: delay,
          opacity
        };

        return (
          <div
            key={index}
            className={`hero-rain-item hero-rain-${motion}${mobileHidden ? " hero-rain-mobile-hide" : ""}`}
            style={wrapperStyle}
          >
            <Image
              className="hero-rain-fruit"
              src={src}
              alt=""
              width={size}
              height={size}
              sizes={`${size}px`}
              style={{ transform: `rotate(${rotate})` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function CartPreview() {
  return (
    <div
      className="card cart-preview"
      style={{ padding: 0, overflow: "hidden", background: "var(--surface)", maxWidth: 620, marginLeft: "auto" }}
    >
      <div className="cart-preview-head">
        <div className="flex gap-12" style={{ alignItems: "center" }}>
          <span className="badge herb">
            <Check size={12} /> Live cart
          </span>
          <span className="t-body-s ink-soft">3 dinners</span>
        </div>
        <span className="t-body-s ink-soft">preview</span>
      </div>
      <div className="cart-preview-body">
        <div>
          <div className="cart-preview-section-head">
            <span className="t-label-xs ink-soft">Picked this week</span>
          </div>
          <div className="cart-preview-meals">
            {sampleMeals.map((title) => (
              <span key={title} className="cart-preview-meal-chip">
                {title}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="cart-preview-section-head">
            <span className="t-label-xs ink-soft">In the cart</span>
            <span className="t-body-s ink-soft">shared items merged</span>
          </div>
          <div className="cart-preview-list">
            {sampleCartItems.map(({ name, amount, overlap, Icon }) => (
              <div key={name} className="cart-preview-row">
                <div className="cart-preview-icon">
                  <Icon size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="t-body-s" style={{ fontWeight: 500 }}>
                    {name}
                  </div>
                  <div className="cart-preview-amount">{amount}</div>
                </div>
                <span className="cart-preview-tag">{overlap}</span>
              </div>
            ))}
            <div className="cart-preview-hidden">
              <span className="t-body-s ink-soft">+ {hiddenCartItems} more groceries hidden</span>
            </div>
          </div>
        </div>
      </div>
      <div className="cart-preview-foot">
        <span className="t-body-s ink-soft">minimum met</span>
        <div className="cart-preview-total-inline">
          <span className="t-data-m">€46.80</span>
          <span className="cart-preview-total-note">total</span>
        </div>
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
