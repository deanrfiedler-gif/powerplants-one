// Builds (or clears) the My Work review scenario of design report r03 / mockups r06 for one
// synthetic identity, through the running local application's ordinary API. It never touches the
// database directly, never resets anything, and only works where the local synthetic session
// endpoint exists. Usage, with the dev server running:
//   node --env-file=.env.local --import tsx scripts/my-work-scenario.ts          build the scenario
//   node --env-file=.env.local --import tsx scripts/my-work-scenario.ts clear    close it again
// Then choose the "SYN Company B coordinator" identity and open /work.
import { clearDesk, MY_WORK, seedScenario, type Call } from "../tests/helpers/my-work";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
if (process.env.PPO_ENV !== "local-synthetic") throw Error("The My Work scenario is for the local synthetic environment only.");
const session = await fetch(`${origin}/api/v1/local-session`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({ profile: MY_WORK.profile }),
});
if (!session.ok) throw Error(`Could not select the synthetic identity (${session.status}). Is the dev server running?`);
const cookie = session.headers.get("set-cookie")!.split(";")[0];
const call: Call = async (path, body) => {
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { cookie, Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
};
if (process.argv[2] === "clear") {
  await clearDesk(call);
  console.log("My Work scenario cleared for", MY_WORK.profile);
} else {
  await seedScenario(call);
  const overview = (await call("work/overview")).body as {
    counts: { overdue: number; due_today: number; date_needed: number };
    waiting: { total?: number };
    gaps: { total?: number };
    schedule: { items: unknown[] };
  };
  console.log("My Work scenario built for", MY_WORK.profile, {
    ...overview.counts,
    appointments: overview.schedule.items.length,
    waiting: overview.waiting.total,
    no_next_activity: overview.gaps.total,
  });
}
