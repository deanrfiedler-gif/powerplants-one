import type { Metadata, Viewport } from "next";
import { ProductHeader, ProductNavigation } from "../components/product-navigation";
import { appleTouchIconPath, navy } from "../platform/installation";
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
import "./module-workspaces.css";
export const metadata: Metadata = {
  title: "Powerplants One | Private prototype",
  description: "Private synthetic application foundation for Powerplants One",
  robots: { index: false, follow: false },
  applicationName: "Powerplants One",
  // The manifest link itself comes from the src/app/manifest.ts file convention.
  // These add the icon and installed-title metadata Apple reads from the document.
  icons: {
    icon: [{ url: "/pwa/ppo-app-icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: appleTouchIconPath, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Powerplants One",
    // An opaque status bar. A transparent bar would need full-bleed safe-area work
    // across every existing screen, which this installation change does not do.
    statusBarStyle: "default",
  },
  // Next emits the current `mobile-web-app-capable`. Older iOS releases read only the
  // Apple-prefixed name, so the legacy tag is declared alongside it.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: navy,
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
