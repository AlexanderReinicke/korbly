import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export function LegalPageShell({
  title,
  kicker,
  updated,
  children
}: {
  title: string;
  kicker: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="paper-grain" style={{ minHeight: "100vh" }}>
      <div className="topnav">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", gap: 24 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span className="t-display-s">Korbly</span>
          </Link>
          <div className="flex gap-24 mobile-hide" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <Link className="t-body-s ink-soft ul" href="/impressum">
              Impressum
            </Link>
            <Link className="t-body-s ink-soft ul" href="/datenschutz">
              Datenschutz
            </Link>
            <Link className="btn btn-primary" href="/plan/new" style={{ padding: "10px 18px" }}>
              Build my order
            </Link>
          </div>
        </div>
      </div>

      <section className="container-narrow" style={{ paddingTop: 72, paddingBottom: 36 }}>
        <span className="t-label-xs ink-paprika">{kicker}</span>
        <h1 className="t-display-l mt-12" style={{ marginBottom: 0 }}>
          {title}
        </h1>
        {updated ? (
          <p className="t-body-s ink-soft mt-16" style={{ marginBottom: 0 }}>
            {updated}
          </p>
        ) : null}
      </section>

      <section className="container-narrow" style={{ paddingBottom: 72 }}>
        <article className="card legal-card legal-prose">{children}</article>
      </section>

      <SiteFooter compact />
    </main>
  );
}
