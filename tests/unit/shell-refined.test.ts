import test from "node:test";
import assert from "node:assert/strict";
import {
  refinedPreference,
  refinedPreferenceKey,
  refinedEnabled,
  capShellBadge,
  shortTenantName,
  shellBuildLabel,
  personColour,
} from "../../src/shell/refined";
import { refinedActionGroups } from "../../src/shell/refined-actions";
import { actionsForCapabilities } from "../../src/shell/model";
import { navigationForCapabilities } from "../../src/shell/navigation";

test("refined shell is opt-in, versioned and isolated by identity", () => {
  assert.equal(refinedPreference(null), false);
  for (const value of [
    "true",
    "{",
    '{"schema_version":2,"version":"refined"}',
    '{"schema_version":1,"version":"legacy"}',
  ])
    assert.equal(refinedPreference(value), false);
  assert.equal(
    refinedPreference('{"schema_version":1,"version":"refined"}'),
    true,
  );
  assert.notEqual(
    refinedPreferenceKey("workspace:alice"),
    refinedPreferenceKey("workspace:bob"),
  );
  assert.equal(refinedEnabled("1", false), true);
  assert.equal(refinedEnabled("0", true), false);
  assert.equal(refinedEnabled(undefined, true), true);
  assert.equal(refinedEnabled("true", false), false);
});
test("shell labels preserve full names separately and counts cap at 99+", () => {
  assert.equal(
    shortTenantName("SYN-A · SYN Greenhouse Demonstration"),
    "SYN-A · SYN G…",
  );
  assert.equal(shortTenantName("All companies"), "All companies");
  assert.deepEqual([undefined, 0, -1, NaN, 1, 99, 100].map(capShellBadge), [
    null,
    null,
    null,
    null,
    "1",
    "99",
    "99+",
  ]);
});
test("New follows the registry workspace and only exposes authorised ready entry points", () => {
  const grants = new Set([
    "crm.opportunity.read",
    "crm.opportunity.create",
    "activity.read",
    "activity.edit",
    "shared.read",
    "shared.create",
    "estimating.read",
    "estimating.edit",
  ]);
  const actions = actionsForCapabilities(grants),
    permitted = navigationForCapabilities(grants, false);
  const groups = refinedActionGroups(actions, "sales", permitted, false);
  assert.deepEqual(
    groups.current.map((a) => a.id),
    ["opportunity", "activity"],
  );
  assert.deepEqual(
    groups.shared.map((a) => a.id),
    ["customer", "contact", "site", "equipment"],
  );
  assert.deepEqual(
    groups.other.map((a) => a.id),
    ["estimate"],
  );
  assert.equal(groups.current[0].accelerator, "D");
  assert.equal(groups.shared.find((a) => a.id === "contact")?.accelerator, "C");
  assert.equal(
    groups.current.some((a) => a.accelerator === "Q"),
    false,
    "no invented quotation create route",
  );
  const denied = refinedActionGroups(actions, "sales", [], false);
  assert.deepEqual(denied, { current: [], shared: [], other: [] });
});

test("build footer uses only a validated deployment commit", () => {
  assert.equal(shellBuildLabel("a".repeat(40)), "Build aaaaaaaa");
  assert.equal(shellBuildLabel(undefined), "Local build");
  assert.equal(shellBuildLabel("unknown"), "Local build");
});

test("refined header and menu text and marker pairings meet contrast requirements", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile("src/app/styles/shell-refined-tokens.css", "utf8");
  const tokens = Object.fromEntries(
    [...css.matchAll(/--ppo-refined-([\w-]+):\s*(#[\da-f]{6});/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(
    Object.keys(tokens).length,
    66,
    "all PPO colour variables are present",
  );
  const rgb = (name: string) =>
    tokens[name]
      .slice(1)
      .match(/../g)!
      .map((n) => parseInt(n, 16) / 255);
  const luminance = (channels: number[]) =>
    channels
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
      .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a: number[], b: number[]) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  for (const [ink, surface] of [
    ["brand-white", "brand-navy-deep"],
    ["brand-navy", "brand-white"],
    ...["text-ink", "text-secondary", "text-link"].flatMap((ink) =>
      ["surface-canvas", "surface-hover", "surface-navy-tint"].map(
        (surface) => [ink, surface],
      ),
    ),
    ...["sage", "sky", "lilac", "sand", "rose", "teal"].map((c) => [
      `person-${c}-ink`,
      `person-${c}-surface`,
    ]),
  ])
    assert.ok(ratio(rgb(ink), rgb(surface)) >= 4.5, `${ink} on ${surface}`);
  const navy = rgb("brand-navy-deep"),
    white = rgb("brand-white");
  const searchSurface = navy.map((n, i) => n * 0.88 + white[i] * 0.12);
  const placeholder = searchSurface.map((n, i) => n * 0.28 + white[i] * 0.72);
  assert.ok(
    ratio(placeholder, searchSurface) >= 4.5,
    "translucent search placeholder",
  );
  assert.ok(ratio(white, navy) >= 3, "bar icons and focus ring");
  assert.ok(
    ratio(rgb("text-link"), rgb("surface-canvas")) >= 3,
    "popover focus ring",
  );
});

test("identity avatar colours are stable across visits without using status colours", () => {
  const colours = new Set(["sage", "sky", "lilac", "sand", "rose", "teal"]);
  for (const identity of ["workspace:alice", "workspace:bob", "SYN 李", ""]) {
    assert.ok(colours.has(personColour(identity)));
    assert.equal(personColour(identity), personColour(`${identity}`));
  }
});
