import { createRoot } from "react-dom/client";
import { ShellProvider } from "../../src/components/shell-provider";
import {
  ProductHeader,
  ProductNavigation,
} from "../../src/components/product-navigation";
import { BusinessSession } from "../../src/components/business-session";
import { JobPackScreen } from "../../src/documents/components/client/job-pack-screen";
import { destinations } from "../../src/shell/navigation";
import fixture from "../fixtures/job-pack-read.json";
const pack = fixture.items[0];
// Presentation only: actual React/CSS with a retained synthetic permitted read.
window.fetch = async (input) => {
  const path = new URL(String(input), "http://fixture.invalid").pathname;
  const identity = {
    actor_id: "30000000-0000-4000-8000-000000000001",
    workspace_id: "10000000-0000-4000-8000-000000000001",
    display_name: "SYN Coordinator",
  };
  const value = path.endsWith("/local-session")
    ? identity
    : path.endsWith(`/packs/${pack.id}`)
      ? fixture
      : path.endsWith("/shell/context")
        ? {
            ...identity,
            preference_scope: `${identity.workspace_id}:${identity.actor_id}`,
            navigation: destinations.filter((d) => d.href).map((d) => d.id),
            actions: [],
            can_preview: true,
          }
        : null;
  return new Response(
    JSON.stringify(value ?? { message: "Fixture does not provide that API" }),
    {
      status: value ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    },
  );
};
createRoot(document.getElementById("root")!).render(
  <ShellProvider hosted={false} development>
    <div className="app-frame">
      <ProductNavigation />
      <div className="workspace">
        <ProductHeader />
        <main id="main">
          <BusinessSession>
            <JobPackScreen id={pack.id} />
          </BusinessSession>
        </main>
      </div>
    </div>
  </ShellProvider>,
);
