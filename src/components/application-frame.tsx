"use client";
import { usePathname } from "next/navigation";
import { ProductHeader, ProductNavigation } from "./product-navigation";
import { ShellProvider } from "./shell-provider";
import { SessionViewBoundary } from "./session-view-boundary";

export function ApplicationFrame({
  children,
  hosted,
  development,
}: {
  children: React.ReactNode;
  hosted: boolean;
  development: boolean;
}) {
  const pathname = usePathname();
  // Presentation only. The preview page independently enforces the server gate.
  // No shell/session fetching or business controls are mounted in the fixture document.
  if (development && pathname === "/development/component-preview")
    return (
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    );
  return (
    <ShellProvider hosted={hosted} development={development}>
      <div className="app-frame">
        <ProductNavigation />
        <div className="workspace">
          <ProductHeader />
          <main id="main" tabIndex={-1}>
            <SessionViewBoundary>{children}</SessionViewBoundary>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
