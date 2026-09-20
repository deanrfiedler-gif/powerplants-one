import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import manifest from "../../src/app/manifest";
import {
  appIdentity,
  appStart,
  appleTouchIconPath,
  installationIcons,
  manifestPath,
  maskableSafeFraction,
  publicInstallationAsset,
  publicInstallationAssets,
} from "../../src/platform/installation";
import { loginPolicy, renderLoginPage } from "../../src/login/login-page";

// Dimensions come from the PNG header rather than a decoder, so the check needs no
// image dependency. The maskable safe-zone measurement is a rendered check in
// scripts/pwa-icons.ts, which reads real pixels.
function png(bytes: Buffer) {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "not a PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), depth: bytes[24], colour: bytes[25] };
}

test("the manifest declares one stable, record-free identity that survives releases", () => {
  const value = manifest();
  assert.equal(value.id, appIdentity);
  assert.equal(value.start_url, appStart);
  assert.equal(value.start_url, "/work");
  assert.equal(value.scope, "/");
  assert.equal(value.display, "standalone");
  assert.equal(value.name, "Powerplants One");
  assert.equal(value.short_name, "PPO");
  assert.equal(value.lang, "en-AU");
  assert.equal(value.theme_color, "#242a37");
  assert.equal(value.background_color, "#f5f6f8");
  assert.equal(value.prefer_related_applications, false);
  // Orientation stays unlocked and fullscreen is never used to hide system controls.
  assert.equal("orientation" in value, false);
  assert.notEqual(value.display, "fullscreen");
  // No identity, tenant, token, timestamp, build hash or per-install query string.
  const identity = `${value.id} ${value.start_url} ${value.scope}`;
  assert.doesNotMatch(identity, /[?#]|token|session|tenant|user|=|\d{4}-\d{2}-\d{2}|[0-9a-f]{16}/i);
  // No invented store links or screenshots.
  assert.equal("screenshots" in value, false);
  assert.equal("related_applications" in value, false);
});

test("every declared icon is a real same-origin PNG of the size it claims", async () => {
  for (const icon of installationIcons) {
    const bytes = await readFile(new URL(`../../public${icon.path}`, import.meta.url));
    const header = png(bytes);
    assert.equal(`${header.width}x${header.height}`, icon.sizes, icon.path);
    // Truecolour with or without an alpha channel. Actual per-pixel opacity and the
    // maskable safe zone are measured from rendered pixels by scripts/pwa-icons.ts.
    assert.ok([2, 6].includes(header.colour!), `${icon.path} colour type ${header.colour}`);
    assert.ok(icon.path.startsWith("/pwa/"), icon.path);
    // The issued reference pack is the source and stays unchanged in docs/reference.
    if (icon.path !== "/pwa/ppo-app-icon-maskable-512.png") {
      const source = await readFile(
        new URL(`../../docs/reference/ui/ppo-logo-pack/icons/${icon.path.slice("/pwa/".length)}`, import.meta.url),
      );
      assert.ok(source.equals(bytes), `${icon.path} must match the issued pack export`);
    }
  }
  const declared = manifest().icons ?? [];
  assert.deepEqual(
    declared.map((icon) => icon.src),
    installationIcons.filter((icon) => icon.manifest).map((icon) => icon.path),
  );
  assert.equal(declared.filter((icon) => icon.purpose === "maskable").length, 1);
  assert.equal(declared.filter((icon) => icon.purpose === "any").length, 2);
  // Apple reads the touch icon from the document link, not from the manifest.
  assert.equal(declared.some((icon) => icon.src === appleTouchIconPath), false);
  assert.equal(maskableSafeFraction, 0.4);
});

test("only exact installation paths are public, and only for safe reads", () => {
  assert.deepEqual(publicInstallationAssets, [
    manifestPath,
    "/pwa/ppo-app-icon-192.png",
    "/pwa/ppo-app-icon-512.png",
    "/pwa/ppo-app-icon-maskable-512.png",
    appleTouchIconPath,
  ]);
  for (const path of publicInstallationAssets)
    for (const method of ["GET", "HEAD"]) assert.equal(publicInstallationAsset(method, path), true, `${method} ${path}`);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "get", "head", ""])
    assert.equal(publicInstallationAsset(method, manifestPath), false, method);
  for (const path of [
    // No prefix, directory, wildcard or sibling gains access from the allowlist.
    "/pwa", "/pwa/", "/pwa/../pwa/ppo-app-icon-192.png/..", "/pwa/ppo-app-icon-16.png",
    "/pwa/ppo-app-icon-192.png/", "/pwa/ppo-app-icon-192.png.map", "//pwa/ppo-app-icon-192.png",
    "/PWA/ppo-app-icon-192.png", "/pwa/ppo-app-icon-192.PNG", "/public/pwa/ppo-app-icon-192.png",
    // Percent-encoded variants are not decoded into the allowlist.
    "/%70wa/ppo-app-icon-192.png", "/pwa%2Fppo-app-icon-192.png", "/manifest%2Ewebmanifest",
    // Traversal cannot reach anything else through it.
    "/pwa/../../package.json", "/pwa/..%2F..%2F.env.local", "/pwa/../.env.local",
    // Ordinary business, API, offline and sign-in paths stay gated.
    "/work", "/sales/opportunities", "/api/v1/work/overview", "/api/v1/shell/context",
    "/offline/index.html", "/sw.js", "/login", "/", "/brand/powerplants-logo-green-white.png",
  ])
    assert.equal(publicInstallationAsset("GET", path), false, path);
});

test("the sign-in document carries the same installation contract under a narrow policy", () => {
  const page = renderLoginPage();
  assert.match(page, new RegExp(`<link rel="manifest" href="${manifestPath}">`));
  assert.match(page, new RegExp(`<link rel="apple-touch-icon" sizes="180x180" href="${appleTouchIconPath}">`));
  assert.match(page, /<meta name="apple-mobile-web-app-capable" content="yes">/);
  assert.match(page, /<meta name="mobile-web-app-capable" content="yes">/);
  assert.match(page, /<meta name="apple-mobile-web-app-title" content="Powerplants One">/);
  assert.match(page, /<meta name="apple-mobile-web-app-status-bar-style" content="default">/);
  assert.match(page, /<meta name="theme-color" content="#242a37">/);
  assert.equal(page.match(/rel="manifest"/g)?.length, 1);
  assert.doesNotMatch(page, /\{\{[A-Z_]+\}\}/);
  // The policy gains only same-origin reads for those exact resources.
  assert.match(loginPolicy, /img-src 'self' data:/);
  assert.match(loginPolicy, /manifest-src 'self'/);
  assert.match(loginPolicy, /script-src 'sha256-/);
  assert.match(loginPolicy, /style-src 'sha256-/);
  assert.match(loginPolicy, /form-action 'self' https:\/\/login\.microsoftonline\.com/);
  assert.doesNotMatch(loginPolicy, /unsafe-inline|unsafe-eval|\*|https?:(?!\/\/login\.microsoftonline\.com)/);
  assert.match(loginPolicy, /^default-src 'none';/);
});
