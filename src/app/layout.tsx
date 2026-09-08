import type { Metadata } from "next";
import { ProductHeader, ProductNavigation } from "../components/product-navigation";
import "./globals.css";
import "./shared-layout.css";
import "./mobile-layout.css";
export const metadata: Metadata = {
  title: "Powerplants One | Local prototype",
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
        <div className="app-frame">
          <ProductNavigation />
          <div className="workspace">
            <ProductHeader />
            <main id="main" tabIndex={-1}>
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}
