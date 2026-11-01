import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// A page joins the shared workspace rules in my-work.css and figma-shell.css by setting
// data-ppo-workspace="shared" on its root, not by adding its id to every list
// (PPO-MERGE-CONFLICT-DEC, 27 October 2026 amendment). The ids already listed stay frozen.
const arm = "[data-ppo-workspace=shared]";
const frozen = new Set([
  "ppo-acceptance",
  "ppo-access-register",
  "ppo-appointment",
  "ppo-changes",
  "ppo-commissioning",
  "ppo-cpq",
  "ppo-discovery-register",
  "ppo-engineering-control",
  "ppo-estimate-reviews",
  "ppo-estimate-wizard",
  "ppo-facilities",
  "ppo-fertigation",
  "ppo-job-pack",
  "ppo-leads",
  "ppo-materials",
  "ppo-my-work",
  "ppo-organisations",
  "ppo-pack-register",
  "ppo-people",
  "ppo-products",
  "ppo-projects",
  "ppo-schedule-changes",
  "ppo-sites",
  "ppo-specialist",
  "ppo-surveys",
]);
// The argument of every top-level :is(…), nested parentheses included.
function lists(css: string): string[] {
  const found: string[] = [];
  for (let at = css.indexOf(":is("); at >= 0;) {
    let depth = 1,
      end = at + 4;
    while (depth) depth += { "(": 1, ")": -1 }[css[end++]] ?? 0;
    found.push(css.slice(at + 4, end - 1));
    at = css.indexOf(":is(", end);
  }
  return found;
}

for (const [file, count] of [
  ["src/app/styles/figma-shell.css", 20],
  ["src/app/styles/my-work.css", 145],
] as const)
  test(`${file}: the shared workspace lists take the opt-in attribute, not new ids`, async () => {
    const shared = lists(await readFile(file, "utf8")).filter((l) =>
      l.includes(arm),
    );
    assert.equal(shared.length, count);
    for (const list of shared)
      for (const [, id] of list.matchAll(/#(ppo-[\w-]+)/g))
        assert(
          frozen.has(id),
          `#${id} was added to a shared workspace list in ${file}; set data-ppo-workspace="shared" on the page root instead`,
        );
    for (const list of lists(await readFile(file, "utf8")))
      if (/#ppo-people\b/.test(list))
        assert(list.includes(arm), `A shared list without ${arm}: ${list}`);
  });
