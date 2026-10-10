import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fontAwesomeKit } from "../../src/platform/font-awesome";
import * as mappings from "../../src/components/font-awesome-icons";
import { NavigationIcon } from "../../src/components/navigation-icons";
import { ProductIcon } from "../../src/components/product-icons";
import { ShellIcon } from "../../src/components/shell-icon";
import { Icon } from "../../src/activities/components/client/my-work-ui";
import { Icon as JobPackIcon } from "../../src/documents/components/client/job-pack-ui";
import { Icon as MaterialsIcon } from "../../src/engineering/materials/components/client/materials-ui";
import { ToneMark } from "../../src/engineering/changes/components/client/changes-ui";
import { Mark } from "../../src/engineering/commissioning/components/client/commissioning-ui";
import { GanttIcon } from "../../src/components/projects-gantt";

// ADR-0050: the owner's Font Awesome Kit draws the icons on online pages; the local drawings remain
// wherever the Kit is not configured or not yet running.
test("only a plain Kit ID can become the Kit script address", () => {
  assert.equal(fontAwesomeKit("ae9d769151"), "ae9d769151");
  assert.equal(fontAwesomeKit(" ae9d769151\n"), "ae9d769151");
  for (const value of ["", "   ", "abc", "x".repeat(33), "ae9d769151.js", "https://kit.fontawesome.com/ae9d769151.js", "ae9d/769151", "ae9d769151\"><script>"]) {
    assert.equal(fontAwesomeKit(value), null, JSON.stringify(value));
  }
});

test("every mapped icon is a plain Font Awesome name and every catalogue is mapped", () => {
  const sizes = Object.fromEntries(Object.entries(mappings).map(([catalogue, map]) => [catalogue, Object.keys(map).length]));
  assert.deepEqual(sizes, {
    navigationFontAwesome: 64, shellFontAwesome: 35, productFontAwesome: 51, myWorkFontAwesome: 45, secondaryMenuFontAwesome: 5,
    jobPackFontAwesome: 12, materialsFontAwesome: 25, changesOutlineFontAwesome: 4, changesToneFontAwesome: 9,
    commissioningOutlineFontAwesome: 5, commissioningMarkFontAwesome: 9, acceptanceFontAwesome: 4, fertigationFontAwesome: 1,
    leadsFontAwesome: 3, ganttFontAwesome: 9,
  });
  for (const [catalogue, map] of Object.entries(mappings)) {
    for (const [name, icon] of Object.entries(map)) assert.match(icon, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${catalogue}.${name}`);
  }
});

test("without a running Kit each icon renders its local drawing, never an empty Font Awesome element", () => {
  const rendered = [
    renderToStaticMarkup(createElement(NavigationIcon, { name: "nav-deals", active: true })),
    renderToStaticMarkup(createElement(ProductIcon, { name: "search" })),
    renderToStaticMarkup(createElement(ShellIcon, { name: "bar-work" })),
    renderToStaticMarkup(createElement(Icon, { name: "refresh" })),
  ];
  for (const html of rendered) {
    assert.match(html, /^<svg class="(product|mw)-icon"/);
    assert.match(html, /viewBox="0 0 24 24"/);
    assert.doesNotMatch(html, /ppo-fa|fa-light|fa-solid/);
  }
  assert.match(rendered[0], /data-variant="active"/);
});

test("module icons also render their local drawings until the Kit runs, and the job pack keeps its r03 markup", () => {
  // The Job Pack r03 icon set is an accepted baseline: until the Kit runs, its first render is byte-identical.
  assert.equal(
    renderToStaticMarkup(createElement(JobPackIcon, { name: "check" })),
    '<svg class="jp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"></path></svg>',
  );
  for (const html of [
    renderToStaticMarkup(createElement(MaterialsIcon, { name: "history" })),
    renderToStaticMarkup(createElement(ToneMark, { icon: "dot" })),
    renderToStaticMarkup(createElement(Mark, { icon: "unsent" })),
    renderToStaticMarkup(createElement(GanttIcon, { name: "fit" })),
  ]) {
    assert.match(html, /^<svg[ >]/);
    assert.doesNotMatch(html, /ppo-fa|fa-light|fa-solid/);
  }
});
