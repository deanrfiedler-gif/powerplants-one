import { createRoot } from "react-dom/client";
import { ApplicationFrame } from "../../src/components/application-frame";

import { BusinessSession } from "../../src/components/business-session";
import { PackListScreen } from "../../src/documents/components/client/job-pack-register";
import { destinations } from "../../src/shell/navigation";
import fixture from "../fixtures/job-pack-read.json";
import { registerClock, registerRows } from "../fixtures/pack-register";

// Presentation evidence only. Database tests independently prove the read projection and permissions.
window.fetch = async (input) => {
  const path = new URL(String(input), "http://fixture.invalid").pathname;
  const identity = {
    actor_id: "30000000-0000-4000-8000-000000000001",
    workspace_id: "10000000-0000-4000-8000-000000000001",
    display_name: "SYN Coordinator",
  };
  const query = new URLSearchParams(location.search);
  const value = path.endsWith("/local-session")
    ? identity
    : path.endsWith("/shell/context")
      ? {
          ...identity,
          preference_scope: `${identity.workspace_id}:${identity.actor_id}`,
          navigation: destinations.filter((d) => d.href).map((d) => d.id),
          actions: [],
          can_preview: true,
        }
      : path.endsWith("/packs/visits")
        ? { items: [], observed_at: registerClock }
        : path.endsWith("/packs")
          ? query.has("denied")
            ? null
            : {
                items: query.has("empty") ? [] : registerRows,
                observed_at: registerClock,
              }
          : path.includes("/packs/")
            ? fixture
            : null;
  return new Response(
    JSON.stringify(
      value ?? {
        code: "NotFound",
        message: "Fixture does not provide this read",
      },
    ),
    {
      status: value ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    },
  );
};
createRoot(document.getElementById("root")!).render(
  <ApplicationFrame hosted={false} development>
    <BusinessSession>
      <PackListScreen />
    </BusinessSession>
  </ApplicationFrame>,
);
