// Builds the EN-07 Engineering Change-Impact Review scenario (desktop mockup r02) through the running local
// application's ordinary API, as the fictional people who would do each step. It never touches the database
// directly and never resets anything. It needs migrations 0029 and 0030 with seeds 29 and 30
// (npm run db:migrate && npm run db:seed), it builds the EN-06 scenario it stands on if that is missing, and it
// only works where the local synthetic session endpoint exists. With the dev server running:
//   node --env-file=.env.local --import tsx scripts/engineering-changes-scenario.ts
// Rerunning it finds every step already done and changes nothing. Then choose "Sam Jordan — materials engineer"
// and open the address it prints.
import { changeScenarioIds, seedChangesScenario } from "../tests/helpers/engineering-changes";
import type { Call, SignIn } from "../tests/helpers/engineering-materials";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
if (process.env.PPO_ENV !== "local-synthetic") throw Error("The EN-07 scenario is for the local synthetic environment only.");
const signIn: SignIn = async (profile) => {
  const session = await fetch(`${origin}/api/v1/local-session`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ profile }) });
  if (!session.ok) throw Error(`Could not select the synthetic identity ${profile} (${session.status}). Is the dev server running, and have seeds 29 and 30 been applied?`);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  const call: Call = async (path, body) => {
    const response = await fetch(`${origin}/api/v1/${path}`, { method: body ? "POST" : "GET", headers: { cookie, Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  return call;
};
const built = await seedChangesScenario(signIn, changeScenarioIds(true));
const register = (await (await signIn("materials-engineer"))(`engineering/${built.package_id}/changes?change=${built.selected}`)).body as {
  total: number; menu: { reviews: number; handovers: number }; items: { reference: string; stage_view: { label: string }; attention_view: { label: string } }[];
  selected: { technical_decision: { label: string }; implementation: { view: { label: string } }; sources: { view: { label: string }; checked_at: string | null }; actions: { primary: { label: string } }; follow_through: { label: string; state: { label: string } }[] } | null };
console.log("EN-07 scenario built:", { changes: register.total, reviews: register.menu.reviews, handovers: register.menu.handovers });
for (const i of register.items) console.log(` ${i.reference}  ${i.stage_view.label.padEnd(18)} ${i.attention_view.label}`);
const s = register.selected;
if (s) console.log("SYN-EN07-003:", s.technical_decision.label, "·", s.implementation.view.label, "·", s.sources.view.label, s.sources.checked_at, "·", s.actions.primary.label, "\n ", s.follow_through.map((f) => `${f.label} — ${f.state.label}`).join(" | "));
console.log(`Open ${origin}${built.href}`);
