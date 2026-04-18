import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Impressum | Korbly",
  description: "Rechtliche Anbieterkennzeichnung fuer Korbly."
};

export default function ImpressumPage() {
  return (
    <LegalPageShell kicker="Legal" title="Impressum">
      <h2>Angaben nach § 5 ECG</h2>
      <address>
        Alexander Andreas Reinicke
        <br />
        Favoritenstraße 224/222
        <br />
        1100 Wien, Österreich
      </address>

      <h3>Kontakt</h3>
      <p>
        E-Mail: <a className="ul" href="mailto:alex.reinicke@icloud.com">alex.reinicke@icloud.com</a>
      </p>

      <h3>Gewerbebehörde</h3>
      <p>Magistrat der Stadt Wien, Bezirksamt für den 10. Bezirk</p>

      <h3>Inhaltlich verantwortlich</h3>
      <p>Alexander Andreas Reinicke</p>

      <h2>Online-Streitbeilegung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform für die Online-Streitbeilegung bereit:{" "}
        <a className="ul" href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
          ec.europa.eu/consumers/odr
        </a>
        . Korbly ist weder gesetzlich verpflichtet noch derzeit bereit, an einem Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Die Inhalte dieser Website werden mit Sorgfalt erstellt. Trotzdem kann keine Gewähr dafür übernommen werden,
        dass alle Angaben jederzeit vollständig, richtig und aktuell sind. Für eigene Inhalte gelten die allgemeinen
        gesetzlichen Bestimmungen.
      </p>
    </LegalPageShell>
  );
}
