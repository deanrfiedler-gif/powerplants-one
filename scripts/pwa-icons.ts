// Installation icon assets. `build` renders the padded maskable derivative from the
// issued logo-pack vector; `verify` decodes every published PNG and reports its real
// dimensions, opacity and maskable safe-zone radius. Both use the reviewed Chrome
// channel already required for document rendering, so no runtime image dependency
// is added. The issued pack in docs/reference/ is read only and never rewritten.
import { readFile, writeFile } from "node:fs/promises";
import { launchDocumentBrowser } from "../src/platform/browser";
import { canvas, installationIcons, maskableSafeFraction, navy } from "../src/platform/installation";

const packIcons = "docs/reference/ui/ppo-logo-pack/icons";
// The symbol's own extent is ry 470 plus half of the 52 stroke, inside a -520..520 box.
const symbolExtent = 496,
  symbolBox = 520;
// Draw the mark to 33% of the icon width, leaving real margin inside the 40% safe circle.
const maskableTarget = 0.33;

/** Pad the issued vector mark on its own opaque navy field without altering its geometry. */
export function maskableSource(pack: string, size: number) {
  const inner = /<svg x="96"[\s\S]*?<\/svg>/.exec(pack)?.[0];
  if (!inner) throw new Error("The issued app icon no longer contains the expected symbol group.");
  const scale = (maskableTarget * size) / symbolExtent;
  const box = symbolBox * scale * 2,
    offset = (size - box) / 2;
  const placed = inner
    .replace(/^<svg x="96" y="96" width="832" height="832"/, `<svg x="${offset}" y="${offset}" width="${box}" height="${box}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Powerplants One">
<title>Powerplants One</title>
<desc>Maskable application icon. The issued compact PPO symbol on an opaque navy field, padded so the artwork stays inside the central safe circle of radius 40% of the icon width.</desc>
<rect width="${size}" height="${size}" fill="${navy}"/>
${placed}
</svg>`;
}

async function inspect(page: import("playwright").Page, bytes: Buffer) {
  const data = `data:image/png;base64,${bytes.toString("base64")}`;
  return page.evaluate(async (source) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    context.drawImage(image, 0, 0);
    const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height);
    const centre = (canvas.width - 1) / 2;
    let transparent = 0,
      radius = 0;
    // The corner pixel is the icon's own background; anything else is artwork.
    const [br, bg, bb] = [pixels[0]!, pixels[1]!, pixels[2]!];
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i + 3]! < 255) transparent++;
        const near = Math.abs(pixels[i]! - br) < 12 && Math.abs(pixels[i + 1]! - bg) < 12 && Math.abs(pixels[i + 2]! - bb) < 12;
        if (!near) radius = Math.max(radius, Math.hypot(x - centre, y - centre));
      }
    return {
      width: canvas.width, height: canvas.height, transparent,
      background: `#${[br, bg, bb].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
      artworkFraction: radius / canvas.width,
    };
  }, data);
}

const mode = process.argv[2] ?? "verify";
const browser = await launchDocumentBrowser();
try {
  const page = await browser.newPage();
  await page.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
  await page.setContent("<!doctype html><html lang='en-AU'><title>PPO icon check</title>");
  if (mode === "build") {
    const source = maskableSource(await readFile(`${packIcons}/ppo-app-icon.svg`, "utf8"), 512);
    const shot = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
    await shot.setContent(`<!doctype html><html lang="en-AU"><title>PPO maskable icon</title><style>html,body{margin:0;padding:0;background:${navy}}svg{display:block}</style>${source}`);
    await writeFile("public/pwa/ppo-app-icon-maskable-512.png", await shot.screenshot({ omitBackground: false }));
    await shot.close();
    console.log("Rendered public/pwa/ppo-app-icon-maskable-512.png from the issued vector mark.");
  }
  if (mode === "preview") {
    // Launcher-sized circular and rounded-square crops, so the maskable claim is
    // reviewed as a device renders it rather than as a full square.
    const tiles = await Promise.all(
      installationIcons.map(async (icon) => ({
        icon,
        data: `data:image/png;base64,${(await readFile(`public${icon.path}`)).toString("base64")}`,
      })),
    );
    const shot = await browser.newPage({ viewport: { width: 640, height: 260 }, deviceScaleFactor: 2 });
    await shot.setContent(`<!doctype html><html lang="en-AU"><title>PPO icon crops</title>
<style>body{margin:0;padding:18px;font:12px/1.4 Verdana,sans-serif;background:${canvas};color:${navy}}
ul{display:flex;gap:20px;list-style:none;margin:0;padding:0}li{text-align:center}
figure{margin:0 0 6px}img{width:96px;height:96px;display:block}
.circle img{border-radius:50%}.squircle img{border-radius:22px}b{display:block;font-size:11px}small{color:#606977}</style>
<ul>${tiles
      .map(({ icon, data }) => `<li><b>${icon.sizes} ${icon.purpose}</b>
<figure class="circle"><img src="${data}" alt="${icon.path} under a circular launcher mask"></figure>
<figure class="squircle"><img src="${data}" alt="${icon.path} under a rounded-square launcher mask"></figure>
<small>${icon.path.replace("/pwa/", "")}</small></li>`)
      .join("")}</ul>`);
    await writeFile("verification-evidence/pwa-icon-crops.png", await shot.screenshot());
    await shot.close();
    console.log("Wrote verification-evidence/pwa-icon-crops.png (circular and rounded-square crops at 96 px).");
  }
  const report = [];
  for (const icon of installationIcons) {
    const bytes = await readFile(`public${icon.path}`);
    const measured = await inspect(page, bytes);
    report.push({
      file: icon.path, declared: icon.sizes, purpose: icon.purpose,
      ...measured, bytes: bytes.length,
      maskableSafe: measured.artworkFraction <= maskableSafeFraction,
    });
  }
  console.log(JSON.stringify(report, null, 2));
  const failed = report.filter(
    (r) => `${r.width}x${r.height}` !== r.declared || r.transparent > 0 ||
      (r.purpose.includes("maskable") && !r.maskableSafe),
  );
  if (failed.length) {
    console.error(`Icon verification failed for: ${failed.map((f) => f.file).join(", ")}`);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
