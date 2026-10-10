# Application shell and global navigation

<!-- versioning: git; committed history is authoritative -->

ES-01 retains the existing `estimates` navigation identity and `/estimating` route with the label Intake & workload. Receiving Intake is the separate implemented `/estimating/intake` destination; Saved estimates is a local workload register destination. This changes neither shell capability checks nor its information icon. Native workload and existing wizard/specialist browser suites cover the consumer integration.

**Owner:** Dean Fiedler · **Catalogue key:** `application-shell` · **Review:** Pending

The actual ProductNavigation, ProductHeader and ShellControls surround this catalogue. Use the full application window to review them.

## Source and reference

Design: [PPO-Application-Shell-r17.html](../../../reference/ui/application-shell/PPO-Application-Shell-r17.html). Retained shell reference; current environment permissions govern navigation.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Review the real global search, workspace switcher, rail, More and utility controls around this catalogue. Shell access can be unavailable without a running identity/database service.

## Mobile

Resize the actual browser window to review the mobile shell; component-frame presets do not resize the surrounding application.

## Keyboard and accessibility

Check tab order, skip link, More dialog, Escape and focus return in the real host.

## States and interaction

Host example; no isolated interactive fixture is claimed.

## Differences and limits

No synthetic permission grants are supplied. The host is not counted as an isolated runnable fixture.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

Native Engineering routes inherit ProductNavigation/ProductHeader/ShellControls through the shared business layout; `system:shell` is the direct component binding. Page dependencies record the indirect consumers. New Engineering Button controls are excluded from the legacy workspace button reset so their shared variants and 44px targets remain intact. Existing My Work and EN-06–EN-08 reset selectors are unchanged. The host fixture covers current/denied context, open/collapsed menu, breadcrumbs and route-specific help; review remains pending.

## CS native receiving

The existing `system:shell` binding owns the inherited frame around CS pages. Page files do not directly import shell controls, so no false direct-consumer binding is added. The CS stylesheet retains a scoped phone-header containment correction within this real host. The [CS evidence](../../../testing/evidence/cs-native-completion/README.md) and owning page guides record workflow checks and inspected widths. Owner/device comparison remains pending in the explicit CS alignment item.

## Scheduling workspace navigation

The secondary SchedulingNavigation composition reuses current shell permission discovery, native links and shared tokens. It links Planner, Resources, Changes & follow-up, Travel review and Demand & capacity while preserving day, timezone, site and resource context. The global rail retains its existing destinations. The inherited system:shell binding covers the four new routes; their native compositions remain pending review; navigation does not add a capability or grant access. Host examples remain the evidence surface.

Native Scheduling captures exposed legacy identity-grid rules placing header utilities over Service tabs at phone widths. The Scheduling stylesheet restores the existing shell flex row only where SchedulingNavigation is present, following the existing Customers containment pattern. Header button containment is checked at all captured widths; broader legacy shell migration remains separate.

## Notification history reads

The `scope:SH-03` notification host also covers populated repeated-event history. Its request-scoped source reads retain current authority, immutable notice identities and explicit loading/partial states; no cross-request content cache is introduced. The `notification-history-window` state and pending alignment item link to the [bounded read decision](../../../decisions/shared-notification-read-efficiency.md). The shared geometry fixture preserves every seven-width/five-page assertion while resizing each mounted page, with the original deadline and review status unchanged.

The `scope:SH-01` host includes `my-work-breakpoint-read`: crossing 780px mounts the other overview and reads current data again. Its fixture uses the existing exact-response transport observer before the unchanged render assertion. Delayed, refused and unrelated responses are explicit; same-layout resizing does not invent a read. This corrects proof readiness without caching application data or changing authority, layout, assertion deadlines or acceptance status.

## Native Engineering consumers

The EN-02 host fixture also opens Page guide while a real post-save read is pending, then releases that read. The Engineering inspector owns focus only for a newly selected record; refreshing the same selection must not close a shell panel by taking focus. Guide Escape/opener restoration and inspector close/reselection remain explicit keyboard destinations. The `scope:EN-02` consumer and `engineering-guide-during-refresh` state bind this regression to the existing shell host; shell outside-focus dismissal is unchanged. [PR #344 execution evidence](../../../testing/evidence/quotation-supply-followup/README.md) records the baseline failure and candidate proof separately from owner/device acceptance.

EN-02–EN-05 reuse the shared menu and workspace controls under #ppo-engineering-control. The rail exposes basis, drawings and reviews; queries remain contextual. ProductHeader resolves module/view breadcrumbs and the information icon resolves route-specific guidance. Existing EN-06–EN-08 controls/defaults remain. Below 1100 CSS px the native Engineering workspace owns one scroll surface for context, controls and the selected record; it never leaves a tiny inner evidence viewport. Host fixture states: author, reviewer, issuer, read-only, denied and authority not configured. Functional evidence and paired review remain in the programme handover; no review fingerprint is adopted.

## Sales native mobile containment

The Sales review found that the legacy identity-strip grid could override the native phone shell, placing utility controls over the first page action. The native flex rule now matches that legacy selector. Verify the real local-identity host at 390px and 320px, including the back link below the header. The existing `system:shell` binding owns every affected consumer. No reference bytes or owner acceptance are changed.

## Equipment native receiving

Equipment uses the same `system:shell` host binding, without a duplicate shell or isolated fixture. Its scoped phone rule restores the intended flex header: the older identity-strip grid otherwise outranks the shared rule and places utility controls over scrolled records. The live state examples are a scrolled retained backup, failed-fix timeline and calibration-at-use record at 390 px, plus the complete 320–1440 px route matrix. [Equipment evidence](../../../testing/evidence/equipment-native/README.md) records exact captures and source commits. The containment assertion checks that utility controls remain inside the header; keyboard navigation and effective 200% reflow are separate checks. Owner/device acceptance remains pending.

## Service phone header correction

I5 found legacy identity-dependent grid styles placing utilities over the Service navigation. The current shell flex rule now wins with local identity mounted. CRM’s deliberate second filter row remains explicit. Actual component and compiled shared-shell proofs are recorded in the [Job Pack I5 handover](../../../delivery/job-pack-integration-handover.md); owner/device review remains separate.

## ES-01 native receiving

The workload uses the inherited frame and global page-information control. A register-scoped phone rule restores the compact flex header where the older local-identity grid placed utilities over module navigation. The workload browser fixture checks the guide control remains inside its header. No shared shell implementation or isolated fixture changed; owner/device acceptance remains pending. See the [programme handover](../../../delivery/estimating-programme-handover.md).

## ES-03 native consumer

The source register, authored evidence form, independent review and estimate comparison use this family through `src/components/cost-sources.tsx`. Existing catalogue fixtures remain unchanged because the shared component implementation is unchanged. Source-specific unknown/stale/recovery compositions are verified in the host browser tests, not inferred from the catalogue. The read-state binding includes ErrorNotice and host loading/recovery text; it does not claim a new generic ReadState implementation. See the [cost-source handover](../../../delivery/estimating-cost-sources-handover.md) for executed evidence and open paired/owner/device review.

## Maintenance and Warranty consumers

MA-01–MA-07 now reuse this component through the native registers and record workspaces. Exact bindings are in components.json. Synthetic long labels, uncertain saves, stale versions and separate customer/recovery states are in docs/design/development/maintenance-fixtures.json and the Maintenance browser journeys. Review 1440/1024/390/320 px and guide draft retention before owner acceptance.
## PL-04 dedicated local duties

The existing local identity selector includes the distinct fictional scheduling policy reviewer and publisher. Neither receives booking-edit authority. Host fixtures in `tests/scheduling-browser/publication.spec.ts` exercise Scheduling navigation, direct saved-record URLs and identity switches while a protected read is in flight. Session lock clears both PL-01 and PL-04 local journals and remounts the business view; another actor cannot inherit displayed evidence. Hosted identities and grants are unchanged. [Step 5 verification](../../../testing/evidence/scheduling-policy-interface/README.md) is implementation evidence; paired shell/device acceptance stays open.

## FI-06 consumer

IncidentScreen uses this shared control on scope:FI-06 and its three /service/incidents routes. Host/state fixtures: tests/browser/field-incidents.spec.ts and tests/database/field-incidents.test.ts. Review dirty/conflict/uncertain, denied/restricted and reopened outcomes at 1440/1024/390/320 and actual 200% zoom; owner acceptance pending.

## Current development guidance during ES-07 navigation

The existing development guide retains desktop/mobile content, focus, loading and unavailable states. Its pathname lookup now reads the current register binding and guide without rebuilding the full design catalogue. Exact routes still precede record patterns; changed content loses old review applicability and removed bindings remain unavailable. The full catalogue, access gate, Git history and hosted snapshot are unchanged. The live-edit/unknown-binding fixture is `tests/unit/development-workspace.test.ts`; compiled ES-07 and shared-shell journeys remain host proof. Consumer bindings include ES-07; the development-register page records the corresponding lookup boundary. No new accepted image or owner/device/screen-reader review is claimed.

## Products navigation and design bindings

The permitted Sales fixture includes Products as its eighth primary destination and in More. Keep the 25 px semantic icons, fixed rail endpoints, header geometry and department-preserving Products link. Six native Products workspace routes bind their corresponding `products-native-*` records in `ui-baselines.json`; those records remain proposed compositions. The shell/conformance fixtures test exact links, source hashes and owning proof files without changing issued r17 or granting owner acceptance. The Products capability and existing permission filter continue to decide visibility. See the [Products evidence ledger](../../../testing/evidence/products-native/README.md) for the failed head and repair results.

## NAV primary rail and discovery

Compact 76 px and labelled 232 px are real primary-rail modes. The accessible button exposes aria-expanded and persists per identity/browser, falling back to visit memory. Navy is primary with restrained green brand accents. More contains ordinary Workspace selection on both devices; Development preview is distinct. Service/Email duplicate header tabs are removed where the module already owns those same views. Receiving Intake remains distinct from workload. Sales phone labels and Leads global shell are visible. Preserve 780/781 and 1200 px boundaries, all canonical destinations, source IDs and command recovery.

New host fixtures, consumer bindings and the pending NAV alignment item are in components.json/navigation-fixtures.json. Proposed departures are recorded before baseline adoption; the issued r17 shell and r22 theme sources remain unchanged. No accepted new mockup images exist for expansion; inspect actual captures in the NAV ledger and keep owner/device/real-zoom review separate.

NAV hierarchy: use the labelled **Page hierarchy** disclosure for the full authorized parent path when compact header sizing hides ancestors. It supports mouse, keyboard and touch, links remain scoped, Escape restores trigger focus, and the exact record reference is published only after an authorized read. The 44 px control and bounded popover require desktop/mobile review; owner acceptance remains pending.

NAV CI repair: phone inline breadcrumbs show the current page, reserving width beside the 44 px disclosure. The disclosure still contains the full authorized path. Add Lead remains above the persistent phone bar and safe area, including short-height phones. Static UI keeps heading-fit/overflow/focus checks and eleven permitted Sales rail destinations; ordinary Workspace selection is tested in More, distinct from Development preview. Reference r17 is retained unchanged; owner acceptance is pending.

My Work overview uses the module itself as its current breadcrumb. A redundant Overview crumb combined with the old phone override hid both labels; the synthetic successful-read fixture reproduced that empty heading. Subviews still name their view and expose the full hierarchy, with the disclosure in the same flex row as the title. The phone bar has visible labels, equal cells and the canonical Sales Activities day/scope contract. `tests/browser/my-work-mobile.spec.ts` retains the header geometry, current-location, agenda and business assertions; only the superseded icon-only/unscoped bar expectations change. See the [repair screenshot inspection](../../../testing/evidence/pr366-pr367-repair/screenshot-review.md); owner/device/real-zoom acceptance remains pending.

At 320 px, the current title in a header with its own module menu uses 16 px below 361 px so My Work fits beside the existing five 44 px controls. The native phone fixture checks the title's actual scroll/client width, utility bounds and page overflow before returning to its 390 px business scenario. The 780/781 and 1200 px shell/menu transitions remain.

## Current-page approval and unsaved reload

Approving search back to the same record must leave its mounted draft protected. The `nav-current-page-reload` host uses an independently created, permitted synthetic Contact: change its correction, select that exact record by pointer/touch or keyboard, approve, edit again without a clean/dirty cycle, then dismiss native Chrome reload. The later draft must remain and no correction command may be sent. A subsequent actual departure still receives one review.

The shared guard consumes an approval before ignoring the same-URL navigation event; explicit reload approval is consumed by its one unload. Retained views, cancelled transitions, pending/unknown command protection and the higher-priority Discovery guard remain separate. The unit fixtures and real application proof are in [the correction evidence](../../../testing/evidence/navigation-current-page/README.md). This is functional behaviour, with no visual or owner/device review adoption.

## Bell startup boundary

The header imports the standalone `NotificationBell`; the full Notifications workspace keeps its My Work layout and preferences dependencies at its own route. Rendering, current-authority reads, loading/error/partial states and navigation are preserved. The real desktop host opens the bell from Customers before any Notifications visit, verifies its current notice, Escape/focus return and inbox handover. The phone retains its existing hidden header bell and direct inbox entry. Compiled transfer measurements and the desktop/phone inbox regression are recorded in [first-load evidence](../../../testing/evidence/customer-first-load/README.md); owner/device and paired visual acceptance remain pending.

## Phase 00 refinement batch 1

- The phone header names the current page at 17 px / 500 on pages without a section menu; r07's 20 px title stays where a section menu replaces the home tile.
- The rail toggle shows chevrons and the page-hierarchy button a list icon; the ellipsis now means only More.
- The page guide and help tooltips name what they open; the accessible names `Page guide` and `Quick Help` are unchanged for existing tests and shortcuts.
- The search shortcut hint and panel footer use `--text-secondary`. See [the shell contract](../systems/shell.md).

## Font Awesome icons (ADR-0050)

- `src/components/font-awesome-icons.ts` maps every name in the navigation, shell, product, My Work and secondary-menu icon sets to a Font Awesome icon. Each map is typed against its set, so an unmapped name fails the type check.
- `FontAwesomeGlyph` renders the local drawing until the owner's Kit is running, then an `<i>` with the same sizing class: Classic Light, or Classic Solid for a selected rail item. Font Awesome nests its SVG inside that element, so React keeps every node it rendered.
- The Kit loads only when `PPO_FONT_AWESOME_KIT` holds a plain Kit ID. CI, copies of the repository, the offline workspace and the sign-in page keep the local drawings.
- The selected rail item is a plain white tile with a navy Solid glyph. Dean asked on 10 October 2026 for the pale green tint and the 3 px left bar to be removed. Hover and focus are unchanged.
- At Dean's request, the More panel's selected link matches it. The link is a neutral `#e8ecf1` tile with navy text and a filled glyph, in place of the green tint and green ink. This applies to the desktop panel and the phone's All modules menu. Hover stays `#f0f3f6`, and phone bar cells keep their own marker.
- The module icon sets are mapped in the same file and drawn the same way: job packs, materials, engineering changes, commissioning, acceptance, fertigation, leads and the Gantt chart. Only the static sign-in page keeps its drawings. Visual review of the Font Awesome icons is pending.
- Service rail: Incidents and actions, Inspection review, Service agreements, Maintenance and Warranty each have their own glyph (triangle-exclamation, list-check, file-contract, screwdriver-wrench, shield-check), Dean's decision of 10 October 2026. Two new local drawings, `nav-agreements` and `nav-maintenance`, are their fallbacks. Visual review in the running app is pending.
- Stylesheet rules whose subject is a bare `svg` read `:is(svg, i.ppo-fa)`, so they size the Font Awesome element as they sized the drawing. Font Awesome's own SVG keeps no stroke or margin, at 84% of its box (`shared-layout.css`).

## Session check keeps the shell context

`ShellProvider` keeps its current context while `ppo-session-ready` re-reads it, so the rail toggle and other context-dependent controls no longer blank for about 100 ms after load. Identity changes still clear it through `ppo-session-lock`. Reasoning, invariant and proof: [the shell contract](../systems/shell.md#shell-context-stays-through-the-session-check--9-october-2026).
