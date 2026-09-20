import type { Metadata } from "next";
import { ProductHeader, ProductNavigation } from "../components/product-navigation";
import { SessionViewBoundary } from "../components/session-view-boundary";
import { ShellProvider } from "../components/shell-provider";
import "./globals.css";
import "./shared-layout.css";
import "./mobile-layout.css";
import "./crm-refinements.css";
import "./crm-board-polish.css";
import "./desktop-shell.css";
import "./crm-r38.css";
import "./leads.css";
import "./projects-gantt.css";
import "./engineering.css";
import "./field-technicians.css";
import "./styles/job-pack.css";
import "./styles/my-work.css";
import "./styles/my-work-mobile.css";
import "./styles/engineering-materials.css";
import "./styles/engineering-changes.css";
import "./module-workspaces.css";
export const metadata: Metadata = {
  title: "Powerplants One | Private prototype",
  description: "Private synthetic application foundation for Powerplants One",
  robots: { index: false, follow: false },
};
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
        <ShellProvider hosted={process.env.PPO_ENV === "azure-demo"}><div className="app-frame">
          <ProductNavigation />
          <div className="workspace">
            <ProductHeader />
            <main id="main" tabIndex={-1}>
              <SessionViewBoundary>{children}</SessionViewBoundary>
            </main>

          </div>
        </div></ShellProvider>
      </body>
    </html>
  );
}
