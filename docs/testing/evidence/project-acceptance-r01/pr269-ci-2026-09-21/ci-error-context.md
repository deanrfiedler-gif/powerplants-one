# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality-states.spec.ts >> P11 PT-29 all fifteen screen families show actual loading, failure, recovery and current denial
- Location: tests/browser/quality-states.spec.ts:64:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('main').getByText(/^(?:.*\s)?Loading .*…$/)
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('main').getByText(/^(?:.*\s)?Loading .*…$/) with timeout 5000ms
  - waiting for locator('main').getByText(/^(?:.*\s)?Loading .*…$/)
    14 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - link "Skip to main content":
    - /url: "#main"
  - generic [ref=f1e2]:
    - navigation "Mobile navigation" [ref=f1e3]:
      - link "My Work" [ref=f1e4] [cursor=pointer]:
        - /url: /work
      - link "Opportunities" [ref=f1e10] [cursor=pointer]:
        - /url: /sales/opportunities
      - link "Activities" [ref=f1e15] [cursor=pointer]:
        - /url: /calendar?day=2026-09-21
      - link "Contacts" [ref=f1e21] [cursor=pointer]:
        - /url: /people
      - button "More" [ref=f1e26] [cursor=pointer]
    - generic [ref=f1e32]:
      - banner [ref=f1e33]:
        - button "My Work menu" [ref=f1e35] [cursor=pointer]
        - strong [ref=f1e40]: My Work / My actions
        - generic [ref=f1e42]:
          - button "Open global search" [ref=f1e43] [cursor=pointer]
          - button "Page guide" [ref=f1e47] [cursor=pointer]
        - region "Local demonstration identity" [ref=f1e53]:
          - button "Change identity" [ref=f1e55] [cursor=pointer]:
            - generic [aria-hidden] [ref=f1e56]: SC
      - main [ref=f1e57]:
        - region "My Work" [ref=f1e59]:
          - generic [ref=f1e60]:
            - status [ref=f1e61]
            - generic [ref=f1e62]:
              - generic [ref=f1e63]:
                - generic [ref=f1e64]:
                  - heading "My actions" [level=1] [ref=f1e65]
                  - paragraph [ref=f1e66]: Every activity in your scope, ordered on the server. Reviews and waiting requests keep their own views.
                - 'button "View: All criteria" [ref=f1e68] [cursor=pointer]'
              - search "Find actions" [ref=f1e74]:
                - generic [ref=f1e75]:
                  - generic [ref=f1e76]: Search activities
                  - searchbox "Search activities" [ref=f1e77]
                - generic [ref=f1e78]:
                  - generic [ref=f1e79]: Owner
                  - combobox "Owner" [ref=f1e80]:
                    - option "My work" [selected]
                    - option "Everyone I can see"
                - generic [ref=f1e81]:
                  - generic [ref=f1e82]: Status
                  - combobox "Status" [ref=f1e83]:
                    - option "Active" [selected]
                    - option "Completed"
                    - option "Cancelled"
                    - option "All"
                - generic [ref=f1e84]:
                  - generic [ref=f1e85]: Due date
                  - combobox "Due date" [ref=f1e86]:
                    - option "Any time" [selected]
                    - option "Overdue"
                    - option "Today"
                    - option "Upcoming"
                    - option "Date needed"
                - generic [ref=f1e87]:
                  - generic [ref=f1e88]: Source
                  - combobox "Source" [ref=f1e89]:
                    - option "Any record" [selected]
                    - option "Leads"
                    - option "Opportunities"
                    - option "Service requests"
                    - option "Sites, assets and customers"
                - generic [ref=f1e90]:
                  - generic [ref=f1e91]: Type
                  - combobox "Type" [ref=f1e92]:
                    - option "All types" [selected]
                    - option "Task"
                    - option "Call"
                    - option "Email"
                    - option "Meeting"
                    - option "Site visit"
                - generic [ref=f1e93]:
                  - generic [ref=f1e94]: Sort
                  - combobox "Sort" [ref=f1e95]:
                    - option "Due time" [selected]
                    - option "Title"
                    - option "Recently updated"
                - button "Clear" [ref=f1e96] [cursor=pointer]
                - button "Refresh activities" [ref=f1e97] [cursor=pointer]
              - status [ref=f1e100]: Loading activities…
              - generic [ref=f1e101]:
                - generic [ref=f1e102]: Synthetic demo data
                - generic [ref=f1e103]: My work
  - alert [ref=f1e104]
```

# Test source

```ts
  194 |   for (const s of matrix) {
  195 |     await test.step(`${s.id}: ${s.url}`, async () => {
  196 |       const screenLoading = page
  197 |         .locator("main")
  198 |         .getByText(/^(?:.*\s)?Loading .*…$/);
  199 |       await call(page, "local-session", { profile: s.profile });
  200 |       const query =
  201 |         s.id === "SC-02" ? "?kind=organisations" :
  202 |         s.id === "SC-13"
  203 |           ? `?account_id=${cmd.account_id}`
  204 |           : s.id === "SC-07"
  205 |             ? "?from=2031-09-21T14:00:00Z&to=2031-09-28T14:00:00Z&timezone=Australia%2FBrisbane"
  206 |             : "";
  207 |       const original = await call(page, s.api + query);
  208 |       const loadedRead = page.waitForResponse((response) =>
  209 |         new URL(response.url()).pathname === `/api/v1/${s.api}` &&
  210 |         response.request().method() === "GET" && response.status() === 200,
  211 |         { timeout: 60000 });
  212 |       // The screen contract is the authorised read and rendered state. A dev
  213 |       // document's unrelated load event is not the selected record's readiness.
  214 |       await Promise.all([
  215 |         loadedRead,
  216 |         page.goto(s.url, { waitUntil: "domcontentloaded" }),
  217 |       ]);
  218 |       await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  219 |       await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  220 |       await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  221 |       await expect(screenLoading).toHaveCount(0);
  222 |       if (s.id === "SC-08") {
  223 |         await expect(page.getByRole("banner").getByText("Service planner", { exact: true })).toBeVisible();
  224 |         await expect(page.getByRole("navigation", { name: "Service navigation", exact: true })
  225 |           .getByRole("link", { name: "Service planner", exact: true })).toHaveAttribute("aria-current", "page");
  226 |       }
  227 |       if (s.id === "SC-14") {
  228 |         await expect(page.getByRole("banner").getByText("Documents", { exact: true })).toBeVisible();
  229 |       }
  230 |       await capture(page, info, `${s.id}-loaded`);
  231 |       const match = (url: URL) => url.pathname === `/api/v1/${s.api}`;
  232 |       let release: () => void = () => {};
  233 |       const wait = new Promise<void>((r) => {
  234 |         release = r;
  235 |       });
  236 |       await page.route(match, async (route) => {
  237 |         await wait;
  238 |         await route.fulfill({
  239 |           status: 503,
  240 |           contentType: "application/json",
  241 |           body: JSON.stringify({
  242 |             code: "DependencyUnavailable",
  243 |             message: `SYN ${s.id} current read unavailable. Retry loading.`,
  244 |             retryable: true,
  245 |           }),
  246 |         });
  247 |       });
  248 |       try {
  249 |         const refresh = s.refresh
  250 |           ? page.getByRole("button", { name: s.refresh, exact: true })
  251 |           : null;
  252 |         if (refresh && (await refresh.count())) await refresh.click();
  253 |         else await page.reload({ waitUntil: "domcontentloaded" });
  254 |         await expect
  255 |           .poll(async () => {
  256 |             for (let i = 0; i < (await screenLoading.count()); i++) {
  257 |               if (await screenLoading.nth(i).isVisible()) return true;
  258 |             }
  259 |             return false;
  260 |           })
  261 |           .toBe(true);
  262 |         await expect(
  263 |           page.getByRole("heading", {
  264 |             name: "Current page summary",
  265 |             exact: true,
  266 |           }),
  267 |         ).toHaveCount(0);
  268 |         if (s.id === "SC-07")
  269 |           await expect(page.locator(".planner-stat-row strong")).toHaveText(
  270 |             Array(4).fill("—"),
  271 |           );
  272 |         await capture(page, info, `${s.id}-loading`);
  273 |       } finally {
  274 |         release();
  275 |       }
  276 |       await expect(
  277 |         page
  278 |           .getByRole("alert")
  279 |           .filter({ hasText: `SYN ${s.id} current read unavailable` }),
  280 |       ).toBeVisible();
  281 |       await expect(screenLoading).toHaveCount(0);
  282 |       await expect(
  283 |         page.getByText(
  284 |           /^(No permitted (activities|service requests|submissions)|No current assigned visits|No Finance handoffs|No job packs are available)/,
  285 |         ),
  286 |       ).toHaveCount(0);
  287 |       await expect(
  288 |         page.getByRole("heading", { name: "Current page summary", exact: true }),
  289 |       ).toHaveCount(0);
  290 |       await capture(page, info, `${s.id}-failed`);
  291 |       await page.unroute(match);
  292 |       await page.reload({ waitUntil: "domcontentloaded" });
  293 |       await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
> 294 |       await expect(screenLoading).toHaveCount(0);
      |                                   ^ Error: expect(locator).toHaveCount(expected) failed
  295 |       if (s.id === "SC-14") {
  296 |         // Applicability is a separate authorised read from immutable metadata.
  297 |         // A failed current-status read must not retain a current-use claim.
  298 |         const statusMatch = (url: URL) =>
  299 |           url.pathname === `/api/v1/pack-issues/${packDetail.current_issue_id}`;
  300 |         await page.route(statusMatch, (route) =>
  301 |           route.fulfill({
  302 |             status: 503,
  303 |             contentType: "application/json",
  304 |             body: JSON.stringify({
  305 |               code: "DependencyUnavailable",
  306 |               message: "SYN current applicability unavailable. Retry this read.",
  307 |               retryable: true,
  308 |             }),
  309 |           }),
  310 |         );
  311 |         await page.reload({ waitUntil: "domcontentloaded" });
  312 |         await expect(
  313 |           page
  314 |             .locator('.business-error[role="alert"]')
  315 |             .filter({ hasText: "SYN current applicability unavailable" }),
  316 |         ).toBeVisible();
  317 |         await expect(
  318 |           page.getByText("Current applicable issue", { exact: true }),
  319 |         ).toHaveCount(0);
  320 |         await expect(
  321 |           page.getByText("Not currently applicable", { exact: true }),
  322 |         ).toHaveCount(0);
  323 |         await capture(page, info, "SC-14-applicability-failed-no-current-claim");
  324 |         await page.unroute(statusMatch);
  325 |         await page.route(statusMatch, (route) =>
  326 |           route.fulfill({
  327 |             status: 403,
  328 |             contentType: "application/json",
  329 |             body: JSON.stringify({
  330 |               code: "Forbidden",
  331 |               message: "SYN current issue access revoked.",
  332 |               retryable: false,
  333 |             }),
  334 |           }),
  335 |         );
  336 |         await page.reload({ waitUntil: "domcontentloaded" });
  337 |         await expect(
  338 |           page
  339 |             .locator('.business-error[role="alert"]')
  340 |             .filter({ hasText: "SYN current issue access revoked" }),
  341 |         ).toBeVisible();
  342 |         await expect(
  343 |           page.getByRole("link", { name: "Download exact A4 PDF", exact: true }),
  344 |         ).toHaveCount(0);
  345 |         await expect(
  346 |           page.getByRole("heading", {
  347 |             name: packDetail.issues[0].manifest.filename,
  348 |             exact: true,
  349 |           }),
  350 |         ).toHaveCount(0);
  351 |         await capture(page, info, "SC-14-secondary-denial-clears-manifest");
  352 |         await page.unroute(statusMatch);
  353 |       }
  354 |       if (s.list) {
  355 |         await page.route(match, (route) =>
  356 |           route.fulfill({
  357 |             status: 200,
  358 |             contentType: "application/json",
  359 |             body: JSON.stringify({ ...original, items: [], next_cursor: null }),
  360 |           }),
  361 |         );
  362 |         await page.reload({ waitUntil: "domcontentloaded" });
  363 |         await expect(screenLoading).toHaveCount(0);
  364 |         await expect(
  365 |           page
  366 |             .getByText(/No (permitted|current assigned|Finance handoffs)/)
  367 |             .first(),
  368 |         ).toBeVisible();
  369 |         await capture(page, info, `${s.id}-empty`);
  370 |         await page.unroute(match);
  371 |       } else {
  372 |         let unavailableRequested = false;
  373 |         let releaseUnavailable: () => void = () => {};
  374 |         const unavailableReady = new Promise<void>((resolve) => {
  375 |           releaseUnavailable = resolve;
  376 |         });
  377 |         await page.route(match, async (route) => {
  378 |           unavailableRequested = true;
  379 |           await unavailableReady;
  380 |           await route.fulfill({
  381 |             status: 404,
  382 |             contentType: "application/json",
  383 |             body: JSON.stringify({
  384 |               code: "RecordUnavailable",
  385 |               message: "The requested record is unavailable to this identity.",
  386 |               retryable: false,
  387 |             }),
  388 |           });
  389 |         });
  390 |         // The unavailable-record assertion starts after the actual selected
  391 |         // read, not while the independent identity prerequisite is loading.
  392 |         try {
  393 |           await page.reload({ waitUntil: "domcontentloaded" });
  394 |           await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true }))
```
