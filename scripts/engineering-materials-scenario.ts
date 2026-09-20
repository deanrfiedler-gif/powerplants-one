// Builds the EN-06 Released Materials & Substitutions review scenario (mockup r04) through the running local
// application's ordinary API, as the fictional people who would do each step. It never touches the database
// directly and never resets anything. It needs migration 0029 and seed 29 (npm run db:migrate && npm run db:seed)
// and only works where the local synthetic session endpoint exists. With the dev server running:
//   node --env-file=.env.local --import tsx scripts/engineering-materials-scenario.ts
// Rerunning it replays the same original operations and changes nothing. Then choose "Alex Lee — materials
// author" and open the address it prints.
import { scenarioIds, seedMaterialsContext, seedMaterialsScenario, type Call, type SignIn } from "../tests/helpers/engineering-materials";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
if (process.env.PPO_ENV !== "local-synthetic") throw Error("The EN-06 scenario is for the local synthetic environment only.");
const signIn: SignIn = async (profile) => {
  const session = await fetch(`${origin}/api/v1/local-session`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ profile }) });
  if (!session.ok) throw Error(`Could not select the synthetic identity ${profile} (${session.status}). Is the dev server running, and has seed 29 been applied?`);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  const call: Call = async (path, body) => {
    const response = await fetch(`${origin}/api/v1/${path}`, { method: body ? "POST" : "GET", headers: { cookie, Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() };
  };
  return call;
};
const ids = scenarioIds(true);
if (process.argv[2] === "context") {
  await seedMaterialsContext(signIn, ids);
  console.log("EN-06 context built: package", ids.package);
} else {
  const built = await seedMaterialsScenario(signIn, ids);
  const register = (await (await signIn("materials-author"))(`engineering/${built.package_id}/materials?set=${built.set_id}`)).body as { counts: { all: number; ready: number; attention: number }; menu: { substitutions_open: number } };
  console.log("EN-06 scenario built:", { ...register.counts, substitutions_open: register.menu.substitutions_open });
  console.log(`Open ${origin}${built.href}`);
}
