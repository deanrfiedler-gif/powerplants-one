// Fails on any high or critical npm advisory in the full locked tree (runtime and
// development) unless it is named below. The runtime tree is gated separately with
// `npm audit --omit=dev --audit-level=high`, which allows no exceptions, so an entry
// here can never hide an advisory that reaches the shipped application.
import { spawnSync } from "node:child_process";

// Each exception names one advisory, the one package it may affect and why it
// cannot be fixed yet. Remove the entry as soon as a fixed release can be locked.
const exceptions = [
  {
    advisory: "GHSA-vfj7-8cjw-p6xm",
    package: "braces",
    recorded: "2026-10-15",
    reason:
      "No fixed release exists (affects <=3.0.3, the latest). Reached only through " +
      "@next/eslint-plugin-next > fast-glob > micromatch, a lint-time dependency " +
      "that expands the repository's own glob patterns.",
  },
];

// A constant command through the shell resolves npm.cmd on Windows as well.
const result = spawnSync("npm audit --json", {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  shell: true,
});
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(result.stderr || result.stdout);
  console.error("npm audit did not return a JSON report.");
  process.exit(1);
}
if (report.error || report.auditReportVersion !== 2 || !report.vulnerabilities) {
  console.error(JSON.stringify(report.error ?? report, null, 2));
  console.error("npm audit did not return a usable report.");
  process.exit(1);
}

const found = new Map();
for (const entry of Object.values(report.vulnerabilities))
  for (const via of entry.via)
    if (typeof via === "object" && ["high", "critical"].includes(via.severity)) {
      const advisory = via.url.split("/").pop();
      found.set(`${advisory} ${via.name}`, { advisory, ...via });
    }

const allowed = (v) =>
  exceptions.some((e) => e.advisory === v.advisory && e.package === v.name);
const blocking = [...found.values()].filter((v) => !allowed(v));
for (const v of found.values())
  console.log(
    `${allowed(v) ? "excepted" : "BLOCKING"} ${v.severity} ${v.name} ${v.range}: ${v.title} (${v.url})`,
  );
for (const e of exceptions)
  if (![...found.values()].some((v) => v.advisory === e.advisory))
    console.log(
      `::warning::${e.advisory} (${e.package}) no longer appears; remove its exception from scripts/check-npm-audit.mjs.`,
    );
if (blocking.length) {
  console.error(
    `${blocking.length} high or critical advisor${blocking.length === 1 ? "y has" : "ies have"} no recorded exception.`,
  );
  process.exit(1);
}
console.log(
  `No unexcepted high or critical advisories (${found.size} excepted, ${exceptions.length} exception${exceptions.length === 1 ? "" : "s"} recorded).`,
);
