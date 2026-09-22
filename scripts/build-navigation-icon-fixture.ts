import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile } from "node:fs/promises";
import { NavigationIcon, navigationDrawings, type NavigationIconName } from "../src/components/navigation-icons";
import { departmentRails, destination } from "../src/shell/navigation";

const folder = "verification-evidence/department-navigation";
await mkdir(folder, { recursive: true });
const icon = (name: NavigationIconName, active: boolean) => renderToStaticMarkup(createElement(NavigationIcon, { name, active }));
const pairs = Object.keys(navigationDrawings).map(key => {
  const name = key as NavigationIconName;
  return `<div class="pair"><span class="tile">${icon(name, false)}</span><span class="tile active">${icon(name, true)}</span><span>${name.slice(4)}</span></div>`;
}).join("");
const sales = departmentRails.sales.map(id => {
  const d = destination(id);
  return `<span class="tile" title="${d.label}">${icon(d.icon as NavigationIconName, false)}</span>`;
}).join("");
await writeFile(`${folder}/icon-fixture.html`, `<!doctype html><html lang="en-AU"><meta charset="utf-8"><title>Navigation icon test fixture</title><style>
body{margin:0;background:#f5f6f8;color:#242a37;font:14px Verdana,sans-serif;padding:24px}h1{font-size:20px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pair{display:flex;gap:8px;align-items:center;padding:8px;background:white;border:1px solid #dce2e9;border-radius:7px}.tile{display:grid;place-items:center;flex:none;width:48px;height:48px;color:white;background:#242a37;border-radius:10px}.tile.active{color:#315e43;background:#f0f6ed;box-shadow:inset 3px 0 #315e43}.tile svg{width:25px;height:25px}.sales{display:flex;gap:8px;padding:12px;background:#242a37;margin:16px 0}
</style><h1>Explicit component fixture — all outline/active pairs at 25px</h1><p>Artwork coverage includes destinations without working landing capabilities. These are samples, not links. Runtime Sales omits Products and Insights.</p><div class="sales">${sales}</div><div class="grid">${pairs}</div></html>`);
console.log(`${folder}/icon-fixture.html`);
