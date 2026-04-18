import Link from "next/link";

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" }
];

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="container" style={{ padding: compact ? "32px 32px 48px" : "48px 32px 64px" }}>
      <div className="site-footer">
        <div className="col gap-8" style={{ maxWidth: 520 }}>
          <span className="t-body-s ink-soft">Korbly · Wien, Österreich</span>
          <span className="t-body-s ink-soft">
            Meal plans, real grocery carts, and Gurkerl checkout without storing your login.
          </span>
        </div>
        <nav className="site-footer-links t-body-s ink-soft" aria-label="Legal">
          {legalLinks.map((link) => (
            <Link key={link.href} className="ul" href={link.href}>
              {link.label}
            </Link>
          ))}
          <a className="ul" href="mailto:alex.reinicke@icloud.com">
            alex.reinicke@icloud.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
