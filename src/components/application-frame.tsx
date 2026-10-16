"use client";
import { usePathname } from "next/navigation";
import { ProductHeader, ProductNavigation } from "./product-navigation";
import { ShellProvider, useShell } from "./shell-provider";
import { SessionViewBoundary } from "./session-view-boundary";

export function ApplicationFrame({
  children,
  hosted,
  development,
  railExpanded = true,
}: {
  children: React.ReactNode;
  hosted: boolean;
  development: boolean;
  railExpanded?: boolean;
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
    <ShellProvider hosted={hosted} development={development} renderedRailExpanded={railExpanded}>
      <FrameContents>{children}</FrameContents>
    </ShellProvider>
  );
}
function FrameContents({ children }: { children: React.ReactNode }) {
  const shell = useShell();
  const path = usePathname();
  const fertigation = (/^\/estimating\/fertigation\/[^/]+$/.test(path) && !path.endsWith("/new"));
  return <div className="app-frame" data-shell-design={fertigation ? "fertigation" : undefined} data-rail={shell.railExpanded ? "expanded" : "compact"}>
        <ProductNavigation />
        <div className="workspace">
          <ProductHeader />
          <main id="main" tabIndex={-1}>
            <SessionViewBoundary>{children}</SessionViewBoundary>
          </main>
        </div>
      </div>;
}
