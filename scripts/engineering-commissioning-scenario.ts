// Builds the EN-08 Commissioning Basis & As-Built Release scenario (desktop mockup r02) through the running local
// application's ordinary API, as the fictional people who would do each step. It never touches the database directly
// and never resets anything. It needs migrations 0029 to 0031 with seeds 29 to 31 (npm run db:migrate && npm run db:seed),
// it builds the EN-06 and EN-07 scenarios it stands on if they are missing, it needs the pinned document browser
// (npm run browser:install) to issue two releases, and it only works where the local synthetic session endpoint exists.
// With the dev server running:
//   node --env-file=.env.local --import tsx scripts/engineering-commissioning-scenario.ts
// Rerunning it finds every step already done and changes nothing. Then choose "Sam Jordan — materials engineer" and
// open the address it prints.
import { commissioningScenarioIds, seedCommissioningScenario } from "../tests/helpers/engineering-commissioning";
import type { Call, SignIn } from "../tests/helpers/engineering-materials";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
if (process.env.PPO_ENV !== "local-synthetic") throw Error("The EN-08 scenario is for the local synthetic environment only.");
const signIn: SignIn = async (profile) => {
  const session = await fetch(`${origin}/api/v1/local-session`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ profile }) });
  if (!session.ok) throw Error(`Could not select the synthetic identity ${profile} (${session.status}). Is the dev server running, and have seeds 29 to 31 been applied?`);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  const call: Call = async (path, body) => {
    const response = await fetch(`${origin}/api/v1/${path}`, { method: body ? "POST" : "GET", headers: { cookie, Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  return call;
};
const built = await seedCommissioningScenario(signIn, commissioningScenarioIds(true));
const register = (await (await signIn("materials-engineer"))(`engineering/${built.package_id}/commissioning?record=${built.selected}`)).body as {
  total: number; items: { reference: string; title: string; area: string; evidence_view: { label: string }; as_built_view: { label: string }; next: { label: string }; owner_name: string | null; due: string | null }[];
  selected: { tags: { label: string }[]; actions: { primary: { label: string } }; handover_section: { service: { label: string } } } | null };
console.log("EN-08 scenario built:", register.total, "packages");
for (const i of register.items) console.log(` ${i.reference}  ${i.title.padEnd(26)} ${i.area.padEnd(20)} ${i.evidence_view.label.padEnd(18)} ${i.as_built_view.label.padEnd(18)} ${i.next.label.padEnd(22)} ${(i.owner_name ?? "Unassigned").padEnd(16)} ${i.due ?? "Date needed"}`);
const s = register.selected;
if (s) console.log("SYN-EN08-001:", s.tags.map((t) => t.label).join(" · "), "·", s.actions.primary.label, "· Service", s.handover_section.service.label);
console.log(`Open ${origin}${built.href}`);
