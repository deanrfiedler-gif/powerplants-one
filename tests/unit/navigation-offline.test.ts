import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ShellProvider } from "../../src/components/shell-provider";
import { OfflineEntry } from "../../src/components/offline-entry";
test("N09 hosted recovery is explanatory and local originals retain their exact entry",()=>{
  const render=(hosted:boolean)=>renderToStaticMarkup(createElement(ShellProvider,{hosted,children:createElement(OfflineEntry,{newTab:true,children:"Saved originals"})}));
  const hosted=render(true),local=render(false);
  assert.match(hosted,/hosted demo supports online work/);assert.ok(!hosted.includes('href="/offline'));
  assert.match(local,/href="\/offline\/index.html"/);assert.match(local,/noopener noreferrer/);assert.match(local,/Saved originals/);
});
