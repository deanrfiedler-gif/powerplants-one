import { createRoot } from "react-dom/client";
import { BusinessSession } from "../../src/components/business-session";
import {
  ProductHeader,
  ProductNavigation,
} from "../../src/components/product-navigation";
import { ProjectSchedulePage } from "../../src/components/projects-screens";
import {
  addDays,
  phases,
  type Schedule,
  type Task,
} from "../../src/projects/model";
// Actual React application components with explicit synthetic API fixtures.
// This fixture is presentation/interaction evidence, never database or identity proof.
const id = "f1000000-0000-4000-8000-000000000001",
  owner = "30000000-0000-4000-8000-000000000001",
  external = "60000000-0000-4000-8000-000000000001";
const tasks: Task[] = Array.from({ length: 24 }, (_, i) => ({
  id: `f2000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  version: 1,
  title: [
    "Project initiation and site review",
    "Design coordination and stakeholder review",
    "Supplier drawings and approval",
    "Long-lead equipment procurement",
    "Installation and commissioning",
    "Operational handover",
  ][i % 6],
  phase: phases[Math.floor(i / 6)],
  status:
    i < 6 ? "Complete" : i === 8 ? "AtRisk" : i < 12 ? "InProgress" : "Planned",
  milestone: i === 23,
  start_date: i === 16 ? null : addDays("2026-07-13", i * 21),
  finish_date:
    i === 16
      ? null
      : addDays("2026-07-13", i * 21 + (i === 23 ? 0 : i === 8 ? 150 : 25)),
  progress: i < 6 ? 100 : i < 12 ? 40 : 0,
  note: "SYN Manual project coordination note.",
  owner_id: i % 3 ? owner : null,
  external_owner_id: i % 3 ? null : external,
  owner_name: i % 3 ? "SYN Alex Morgan" : "SYN Taylor Smith",
  dependencies: i
    ? [
        {
          task_id: `f2000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          kind: "FS",
        },
      ]
    : [],
}));
const schedule: Schedule = {
  project: {
    id,
    version: 25,
    title: "SYN Block C · Irrigation & climate upgrade",
    display_number: "SYN-PPO-PRJ-000014",
    company_id: "20000000-0000-4000-8000-000000000001",
    organisation_id: "50000000-0000-4000-8000-000000000001",
    site_id: "70000000-0000-4000-8000-000000000001",
    coordinator_id: owner,
    coordinator_name: "SYN Alex Morgan",
    customer_name: "SYN Greenhaven Nursery",
    site_name: "SYN North growing site",
    timezone: "Australia/Brisbane",
    target_date: "2027-11-30",
    updated_at: "2026-09-10T00:00:00Z",
    can_edit: true,
  },
  tasks,
  observed_at: "2026-09-10T00:00:00Z",
};
const mode = new URLSearchParams(location.search).get("mode");
let lost = false,
  conflict = false;
const operations = new Map<string, unknown>();
window.fetch = async (input, init) => {
  const url = new URL(String(input), "http://fixture.invalid");
  let data: unknown;
  if (url.pathname.endsWith("/local-session"))
    data = {
      actor_id: owner,
      workspace_id: "10000000-0000-4000-8000-000000000001",
      display_name: "SYN Alex Morgan",
    };
  else if (url.pathname.endsWith("/shell/context"))
    data = {
      display_name: "SYN Alex Morgan",
      actions: [
        {
          id: "project",
          label: "Project",
          module: "Projects",
          href: "/projects/new",
        },
      ],
    };
  else if (url.pathname.endsWith("/shell/search"))
    data = { items: [], has_more: false, limit_per_type: 5 };
  else if (url.pathname.endsWith("/owners"))
    data = {
      items: [
        { id: owner, display_name: "SYN Alex Morgan", external: false },
        { id: external, display_name: "SYN Taylor Smith", external: true },
      ],
      has_more: false,
    };
  else if (url.pathname.endsWith("/history"))
    data = {
      items: [
        {
          project_version: schedule.project.version,
          event_type: "ProjectTaskSaved",
          reason: "SYN Presentation fixture",
          created_at: "2026-09-10T00:00:00Z",
          actor_name: "SYN Alex Morgan",
        },
      ],
      next_cursor: null,
    };
  else if (url.pathname.endsWith("/tasks") && init?.method === "POST") {
    const body = JSON.parse(String(init.body));
    if (operations.has(body.operation_id))
      return new Response(JSON.stringify(operations.get(body.operation_id)), {
        status: 200,
      });
    if (mode === "conflict" && !conflict) {
      conflict = true;
      schedule.project.version++;
      schedule.tasks[0].title = "SYN Concurrently revised site review";
    }
    if (body.expected_version !== schedule.project.version)
      return new Response(
        JSON.stringify({
          code: "VersionConflict",
          message: "The project schedule changed. Review the current version.",
        }),
        { status: 409 },
      );
    const existing = schedule.tasks.findIndex((t) => t.id === body.id),
      next = {
        ...body,
        version: existing < 0 ? 1 : schedule.tasks[existing].version + 1,
        owner_name: body.owner_id
          ? "SYN Alex Morgan"
          : body.external_owner_id
            ? "SYN Taylor Smith"
            : null,
      };
    if (existing < 0) schedule.tasks.push(next);
    else schedule.tasks[existing] = next;
    schedule.project.version++;
    data = {
      record_id: id,
      record_version: schedule.project.version,
      operation_id: body.operation_id,
      receipt_id: crypto.randomUUID(),
    };
    operations.set(body.operation_id, data);
    if (mode === "uncertain" && !lost) {
      lost = true;
      throw new TypeError("SYN accepted response lost");
    }
  } else if (url.pathname === `/api/v1/projects/${id}`) data = schedule;
  else
    return new Response(
      JSON.stringify({ message: "No synthetic fixture for this route" }),
      { status: 404 },
    );
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
createRoot(document.getElementById("root")!).render(
  <>
    <div className="app-frame">
      <ProductNavigation />
      <div className="workspace">
        <ProductHeader />
        <main id="main">
          <BusinessSession hosted>
            <ProjectSchedulePage id={id} />
          </BusinessSession>
        </main>
      </div>
    </div>
  </>,
);
