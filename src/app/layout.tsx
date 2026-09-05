import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "Powerplants One | Local prototype",
  description: "Private synthetic application foundation for Powerplants One",
  robots: { index: false, follow: false },
};
const domains = [
  "CRM",
  "Estimating & Quotation",
  "Engineering & Design Control",
  "Projects & Commercial Delivery",
  "Service Operations",
  "Supply Chain Management",
  "Finance & Commercial Controls",
];
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <div className="environment">
          Local prototype <span aria-hidden="true">·</span> Synthetic data only
        </div>
        <div className="app-frame">
          <aside className="sidebar">
            <Link href="/" className="brand" aria-label="Powerplants One home">
              <span className="monogram" aria-hidden="true">
                PPO
              </span>
              <span>
                Powerplants
                <br />
                <strong>One</strong>
              </span>
            </Link>
            <nav aria-label="Main navigation">
              <Link href="/">Overview</Link>
              <Link href="/work">My Work</Link>
              <Link href="/customers">Customers</Link>
              <Link href="/sites">Sites &amp; equipment</Link>
              <Link href="/service/tickets">Service requests</Link>
              <Link href="/foundation">Foundation checks</Link>
              <details className="domains" open>
                <summary>Business domains</summary>
                <ul>
                  {domains.map((domain) => (
                    <li key={domain}>
                      <span aria-disabled="true">
                        {domain}
                        <small>
                          {domain === "CRM" || domain === "Service Operations"
                            ? "P03 context & intake"
                            : "Planned"}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </nav>
            <p className="sidebar-note">
              Private development
              <br />
              No live systems connected
            </p>
          </aside>
          <div className="workspace">
            <header className="topbar">
              <span>Powerplants Australia</span>
              <span className="badge">P03 customer context</span>
            </header>
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <footer>
              Powerplants One · Personal private prototype{" "}
              <span>PP-01 service journey remains in development.</span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
