# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sh-platform.spec.ts >> SH review perspectives, responsive geometry and current My Work interiors
- Location: tests/browser/sh-platform.spec.ts:232:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/results on this page/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/results on this page/) with timeout 5000ms
  - waiting for getByText(/results on this page/)

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- complementary "Application navigation":
  - link "Powerplants One home":
    - /url: /
    - img "Powerplants Australia"
  - navigation "Sales shortcuts":
    - link "Pulse":
      - /url: /sales/pulse
    - link "Leads":
      - /url: /sales/leads
    - link "Deals":
      - /url: /sales/opportunities
    - link "Activities":
      - /url: /calendar?scope=sales&department=sales
    - link "Tasks":
      - /url: /sales/tasks
    - link "Sales Inbox":
      - /url: /email?department=sales
    - link "Contacts":
      - /url: /contacts?department=sales
  - button "More"
- banner:
  - navigation "Breadcrumb":
    - list "Search":
      - listitem: Search
  - combobox "Search Powerplants One"
  - button "Quick add"
  - button "Design and build workspace"
  - button "Page guide"
  - button "Quick Help"
  - button "Notifications"
  - region "Local demonstration identity":
    - button "Change identity"
- main:
  - paragraph: Shared workspace
  - heading "Search" [level=1]
  - paragraph: Find records within your current access.
  - button "Saved views"
  - link "My Work":
    - /url: /work
  - text: Search records
  - searchbox "Search records": SYN
  - button "Search"
  - button "Refresh results"
  - status: Searching permitted sources…
- alert
```

# Test source

```ts
  153 | test("SH search keyboard entry, full results, authorised preview and personal saved view", async ({
  154 |   page,
  155 |   isMobile,
  156 | }, info) => {
  157 |   await page.goto("/work");
  158 |   // The shortcut listener belongs to the hydrated shell. An immediate key
  159 |   // after navigation can arrive before the initial session read completes.
  160 |   await expect(
  161 |     page.getByRole("region", { name: "Local demonstration identity", exact: true }),
  162 |   ).toHaveAttribute("aria-busy", "false");
  163 |   // Navigation can finish before hydration installs the global shortcut. Wait
  164 |   // for the client-loaded identity and responsive shell before sending a key;
  165 |   // keyboard.press has no locator readiness checks of its own.
  166 |   await expect(
  167 |     page.getByRole("button", { name: "Change identity", exact: true }),
  168 |   ).toBeVisible({ timeout: 15000 });
  169 |   if (isMobile)
  170 |     await expect(
  171 |       page.getByRole("button", { name: "Open global search", exact: true }),
  172 |     ).toBeVisible();
  173 |   await page.keyboard.press("Control+k");
  174 |   const search = page.getByRole("combobox", { name: /Search/ });
  175 |   await expect(search).toBeFocused();
  176 |   await search.fill("SYN");
  177 |   await expect(page.getByRole("option").first()).toBeVisible();
  178 |   await expect(
  179 |     page.getByRole("link", { name: "View all results", exact: true }),
  180 |   ).toBeVisible();
  181 |   await page.screenshot({ path: info.outputPath("search-compact.png") });
  182 |   await page
  183 |     .getByRole("link", { name: "View all results", exact: true })
  184 |     .click();
  185 |   await expect(
  186 |     page.getByRole("heading", { name: "Search", exact: true }),
  187 |   ).toBeVisible();
  188 |   await expect(page.locator(".sh-register .sh-title").first()).toBeVisible();
  189 |   await page.locator(".sh-register .sh-title").first().click();
  190 |   await expect(
  191 |     page
  192 |       .getByRole("dialog", { name: "Record preview" })
  193 |       .getByRole("link", { name: "Open record" }),
  194 |   ).toBeVisible();
  195 |   await page.screenshot({ path: info.outputPath("search-preview.png") });
  196 |   const preview = page.getByRole("dialog", { name: "Record preview" });
  197 |   await preview.getByRole("button", { name: "Close", exact: true }).focus();
  198 |   await page.keyboard.press("Tab");
  199 |   expect(
  200 |     await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  201 |   ).toBe(true);
  202 |   await page.keyboard.press("Escape");
  203 |   await expect(page.locator(".sh-register .sh-title").first()).toBeFocused();
  204 |   await page.locator(".sh-register .sh-title").first().click();
  205 |   const source = page
  206 |     .getByRole("dialog", { name: "Record preview" })
  207 |     .getByRole("link", { name: "Open record" });
  208 |   const sourcePath = await source.getAttribute("href");
  209 |   await source.click();
  210 |   await expect
  211 |     .poll(() => new URL(page.url()).pathname.startsWith(sourcePath!))
  212 |     .toBe(true);
  213 |   await page.goBack();
  214 |   await expect(
  215 |     page.getByRole("heading", { name: "Search", exact: true }),
  216 |   ).toBeVisible();
  217 |   expect(new URL(page.url()).searchParams.get("q")).toBe("SYN");
  218 |   await expect(page.getByLabel("Search records", { exact: true })).toHaveValue(
  219 |     "SYN",
  220 |   );
  221 |   await page.getByRole("button", { name: "Saved views", exact: true }).click();
  222 |   await page
  223 |     .getByLabel("Save current criteria as")
  224 |     .fill(`SYN browser view ${isMobile ? "phone" : "desktop"} ${Date.now()}`);
  225 |   await page.getByRole("button", { name: "Save view", exact: true }).click();
  226 |   await expect(
  227 |     page.getByRole("button", { name: "Update to current criteria" }).first(),
  228 |   ).toBeVisible();
  229 |   await page.screenshot({ path: info.outputPath("saved-views.png") });
  230 |   await page.keyboard.press("Escape");
  231 | });
  232 | test("SH review perspectives, responsive geometry and current My Work interiors", async ({
  233 |   page,
  234 | }, info) => {
  235 |   test.setTimeout(180000); // Seven widths × five routes plus six review perspectives.
  236 |   // Exercise each mounted page's real reflow. Rebooting every page for every
  237 |   // width adds thirty full navigations without adding a viewport assertion.
  238 |   for (const path of [
  239 |     "/work",
  240 |     "/work/actions",
  241 |     "/work/updates",
  242 |     "/work/reviews",
  243 |     "/search?q=SYN",
  244 |   ]) {
  245 |     await page.setViewportSize({ width: 1440, height: 900 });
  246 |     if (path === "/work" || path === "/work/actions")
  247 |       await navigateToMyWork(page, path);
  248 |     else await page.goto(path);
  249 |     for (const width of [1440, 1280, 1024, 768, 430, 390, 320]) {
  250 |       await resizeMyWork(page, { width, height: 900 });
  251 |       await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  252 |       if (path.startsWith("/search"))
> 253 |         await expect(page.getByText(/results on this page/)).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  254 |       else if (path === "/work/reviews")
  255 |         await expect(page.getByText(/matching tasks/)).toBeVisible();
  256 |       else if (path === "/work/updates")
  257 |         await expect(page.locator(".sh-stats")).toBeVisible();
  258 |       else
  259 |         await expect(page.locator(".mw-page")).toHaveAttribute(
  260 |           "aria-busy",
  261 |           "false",
  262 |         );
  263 |       await expect
  264 |         .poll(() =>
  265 |           page.evaluate(
  266 |             () => document.documentElement.scrollWidth <= window.innerWidth,
  267 |           ),
  268 |         )
  269 |         .toBe(true);
  270 |       if (width === 1440 || width === 390 || width === 320)
  271 |         await page.screenshot({
  272 |           path: info.outputPath(
  273 |             `${path.split("?")[0].replaceAll("/", "-")}-${width}.png`,
  274 |           ),
  275 |           fullPage: true,
  276 |         });
  277 |       if (path === "/work/updates" && [390, 320].includes(width)) {
  278 |         await page
  279 |           .locator(".sh-register > li")
  280 |           .first()
  281 |           .scrollIntoViewIfNeeded();
  282 |         await page.screenshot({
  283 |           path: info.outputPath(`notifications-row-${width}.png`),
  284 |         });
  285 |       }
  286 |     }
  287 |   }
  288 |   await page.setViewportSize({ width: 1440, height: 1000 });
  289 |   await page.goto("/work/reviews");
  290 |   for (const label of [
  291 |     "My reviews",
  292 |     "All permitted",
  293 |     "Returned to me",
  294 |     "Handovers",
  295 |     "Sent by me",
  296 |     "History",
  297 |   ]) {
  298 |     await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  299 |     await expect(page.getByText(/matching tasks/)).toBeVisible();
  300 |     await page.screenshot({
  301 |       path: info.outputPath(`reviews-${label.replaceAll(" ", "-")}.png`),
  302 |       fullPage: true,
  303 |     });
  304 |   }
  305 | });
  306 |
  307 | test("SH real review detail keeps source authority and return navigation for reviewer, author and receiver", async ({
  308 |   page,
  309 |   baseURL,
  310 | }, info) => {
  311 |   test.setTimeout(420000); // Builds the existing real EN-07 source scenario through its ordinary APIs.
  312 |   const contexts = new Map<string, APIRequestContext>();
  313 |   const as: SignIn = async (profile) => {
  314 |     let context = contexts.get(profile);
  315 |     if (!context) {
  316 |       context = await playwrightRequest.newContext({
  317 |         baseURL,
  318 |         extraHTTPHeaders: { Origin: baseURL! },
  319 |       });
  320 |       expect(
  321 |         (
  322 |           await context.post("/api/v1/local-session", { data: { profile } })
  323 |         ).ok(),
  324 |       ).toBe(true);
  325 |       contexts.set(profile, context);
  326 |     }
  327 |     return async (path, body) => {
  328 |       const response = await context!.fetch(`/api/v1/${path}`, {
  329 |         method: body ? "POST" : "GET",
  330 |         data: body,
  331 |       });
  332 |       return { status: response.status(), body: await response.json() };
  333 |     };
  334 |   };
  335 |   try {
  336 |     const source = await seedChangesScenario(
  337 |       as,
  338 |       changeScenarioIds(false),
  339 |       ` SH browser ${Date.now()}`,
  340 |     );
  341 |     for (const [profile, view] of [
  342 |       [CHANGES.reviewer.profile, "mine"],
  343 |       [CHANGES.author.profile, "returned"],
  344 |       [CHANGES.supply.profile, "handovers"],
  345 |     ]) {
  346 |       expect(
  347 |         (
  348 |           await page.request.post("/api/v1/local-session", {
  349 |             headers: { Origin: baseURL! },
  350 |             data: { profile },
  351 |           })
  352 |         ).ok(),
  353 |       ).toBe(true);
```
