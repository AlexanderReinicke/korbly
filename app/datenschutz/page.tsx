import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Datenschutz | Korbly",
  description: "Datenschutzhinweise fuer die Nutzung von Korbly."
};

export default function DatenschutzPage() {
  return (
    <LegalPageShell kicker="Legal" title="Datenschutzerklärung" updated="Stand: April 2026">
      <h2>1. Verantwortlicher</h2>
      <address>
        Alexander Andreas Reinicke
        <br />
        Favoritenstraße 224/222
        <br />
        1100 Wien, Österreich
      </address>
      <p>
        E-Mail: <a className="ul" href="mailto:alex.reinicke@icloud.com">alex.reinicke@icloud.com</a>
      </p>

      <h2>2. Zugriffsdaten beim Besuch der Website</h2>
      <p>
        Beim Aufruf von Korbly werden technische Zugriffsdaten verarbeitet, damit die Website ausgeliefert und vor
        Missbrauch geschützt werden kann. Dazu gehören insbesondere IP-Adresse, Datum und Uhrzeit, aufgerufene URL,
        Browsertyp, Betriebssystem und Referrer.
      </p>
      <p>
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt im
        sicheren und stabilen Betrieb der Website.
      </p>

      <h2>3. Cookies und Browser-Speicher</h2>
      <p>
        Korbly verwendet derzeit keine Marketing-, Tracking- oder Analyse-Cookies. Für den Ablauf innerhalb der
        Planungsstrecke werden Eingaben wie Auswahl, Rezeptvorschläge und Plan-ID kurzfristig im Browser per
        sessionStorage gespeichert, damit Sie einen begonnenen Ablauf nicht verlieren.
      </p>
      <p>
        Diese Daten bleiben nur auf Ihrem Endgerät und werden automatisch gelöscht, sobald die jeweilige Browser-Sitzung
        endet oder Sie den Speicher Ihres Browsers leeren.
      </p>

      <h2>4. Nutzung von Korbly</h2>
      <p>
        Wenn Sie Korbly aktiv verwenden, verarbeiten wir die Daten, die für die Erstellung und Abwicklung Ihres Plans
        erforderlich sind.
      </p>
      <ul>
        <li>Haushaltsgröße, Ernährungsfilter, Küchenpräferenzen und freiwillige Allergiehinweise</li>
        <li>Ausgewählte Rezepte, generierte Einkaufslisten, Warenkorb- und Bestelldaten</li>
        <li>Optional eine E-Mail-Adresse, falls wir Ihnen Ihren Plan zusenden sollen</li>
        <li>Bei gewünschter Bestellung Ihr Gurkerl-Login zur einmaligen Checkout-Ausführung</li>
        <li>Bestellreferenzen wie Bestellnummer, Lieferfenster und Zeitstempel</li>
      </ul>
      <p>
        Die Verarbeitung erfolgt überwiegend auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, weil diese Angaben
        erforderlich sind, um den gewünschten Plan zu erstellen und eine Bestellung in Ihrem Auftrag auszulösen.
      </p>

      <h3>Gurkerl-Zugangsdaten</h3>
      <p>
        E-Mail-Adresse und Passwort für Gurkerl werden ausschließlich verwendet, um die von Ihnen ausgelöste Bestellung
        technisch an Gurkerl zu übermitteln. Korbly speichert diese Zugangsdaten nicht dauerhaft.
      </p>

      <h3>Optionale Plan-E-Mail</h3>
      <p>
        Wenn Sie freiwillig eine Empfängeradresse angeben, wird diese nur verwendet, um Ihnen den Link zu Ihrem
        Korbly-Plan zu senden.
      </p>

      <h2>5. Empfänger und eingesetzte Dienste</h2>
      <p>Je nach Nutzungssituation werden personenbezogene Daten an technische Dienstleister oder Bestellpartner übermittelt:</p>
      <ul>
        <li>Vercel und Vercel KV für Hosting, API-Ausführung und Speicherung von Plan-Daten</li>
        <li>Gurkerl bzw. die eingesetzte Bestellintegration zur Durchführung des von Ihnen angeforderten Checkouts</li>
        <li>Resend für den Versand einer optional von Ihnen angeforderten Plan-E-Mail</li>
      </ul>
      <p>
        Sofern eine Verarbeitung außerhalb des Europäischen Wirtschaftsraums stattfindet, erfolgt sie nur auf Basis der
        dafür vorgesehenen datenschutzrechtlichen Garantien des jeweiligen Anbieters.
      </p>

      <h2>6. Speicherdauer und Löschung</h2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie sie für die beschriebenen Zwecke erforderlich sind oder
        gesetzliche Aufbewahrungspflichten bestehen. Browserdaten in sessionStorage verbleiben auf Ihrem Endgerät bis zum
        Ende der Sitzung. Gurkerl-Zugangsdaten werden nicht dauerhaft gespeichert. Plan- und Bestelldaten werden gelöscht,
        sobald sie für die Bereitstellung des Dienstes und eine etwaige Nachbetreuung nicht mehr benötigt werden.
      </p>

      <h2>7. Ihre Rechte</h2>
      <p>Sie haben im Rahmen der DSGVO insbesondere folgende Rechte:</p>
      <ul>
        <li>Auskunft über die verarbeiteten Daten nach Art. 15 DSGVO</li>
        <li>Berichtigung unrichtiger Daten nach Art. 16 DSGVO</li>
        <li>Löschung nach Art. 17 DSGVO</li>
        <li>Einschränkung der Verarbeitung nach Art. 18 DSGVO</li>
        <li>Datenübertragbarkeit nach Art. 20 DSGVO</li>
        <li>Widerspruch gegen bestimmte Verarbeitungen nach Art. 21 DSGVO</li>
      </ul>
      <p>
        Für die Ausübung Ihrer Rechte genügt eine Nachricht an{" "}
        <a className="ul" href="mailto:alex.reinicke@icloud.com">
          alex.reinicke@icloud.com
        </a>
        .
      </p>

      <h2>8. Datensicherheit</h2>
      <p>
        Korbly verwendet technische und organisatorische Maßnahmen, um personenbezogene Daten angemessen zu schützen. Dazu
        gehören insbesondere verschlüsselte Übertragungen, Zugriffsbeschränkungen und die Beschränkung der Verarbeitung auf
        die für den jeweiligen Zweck erforderlichen Daten.
      </p>

      <h2>9. Beschwerderecht</h2>
      <p>
        Wenn Sie der Auffassung sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen Datenschutzrecht verstößt,
        können Sie sich bei der österreichischen Datenschutzbehörde beschweren:{" "}
        <a className="ul" href="https://www.dsb.gv.at/" target="_blank" rel="noreferrer">
          dsb.gv.at
        </a>
        .
      </p>

      <h2>10. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Diese Datenschutzhinweise können angepasst werden, wenn sich Korbly, die eingesetzten Dienste oder die rechtlichen
        Anforderungen ändern. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.
      </p>
    </LegalPageShell>
  );
}
