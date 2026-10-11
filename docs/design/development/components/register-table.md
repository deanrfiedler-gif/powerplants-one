# House register table

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `register-table` · **Review:** Pending

The shared register: a flush table with a grey sortable header, pinned checkbox and key columns, row emphasis, state chips, an empty message and a footer.

## Source and reference

Implemented baseline: EN-06's owner-refined materials register of 20 September 2026, made shared without visual change (ADR-0051, group 2, item 1). Pattern reference: [EN-07 r03 desktop mockup](../../../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png), the "house register pattern" of the [Service requests refinement](../../../decisions/service-requests-native-refinement.md). Paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## What the host supplies

- `RegisterTable`: `caption` (read by assistive technology only), `variant` (`"register"`, the default, or `"panel"`), `stale`, `wide`, `empty` and `footer`, with the table's `thead` and `tbody` as children.
- `RegisterSortHeader`: `label`, `direction` (`"ascending"`, `"descending"` or none) and `onSort`. A header that does not sort is a plain `th` holding `<span className="ppo-register-label">`.
- Rows: mark them with `data-inspected`, `data-selected` and `data-removed`. Pinned columns use `ppo-register-check` (the checkbox) and `ppo-register-key` (the identifier after it). The one column that wraps uses `ppo-register-wrap`; `wide` gives it 360 px. Cell content uses `ppo-register-row-title` (a button or link that opens the row) and `ppo-register-sub` (a smaller grey sub-line).
- `RegisterEmpty` (`title` and a message) and `RegisterFooter` (count, selection, `ppo-register-spacer`, paging).
- `RegisterChip`: `tone` (`neutral`, `attention`, `positive`, `negative`) and an optional `icon` from the host's icon set. Show a check only for a completed positive state and a warning only where someone must act.

## Desktop

Flush to its pane in one horizontal scroller: no exterior padding, frame or radius. Grey 43 px sentence-case header with column rules; 50 px rows (48 px in a panel). Opening a row inspects it and ticking its checkbox selects it; the two are independent. Sort state is in aria-sort. The footer states the count, the selection and paging.

## Mobile

At 780 px and below the key column unpins and the table scrolls sideways with only the checkbox pinned. Check 390 and 320 px for readable text, reachable selection and a footer that wraps.

## Keyboard and accessibility

Sort buttons, row-title buttons and checkboxes are native, labelled controls with the shared focus ring. A row opens from its title, so inspecting never needs a pointer; the row click is only a larger target.

## States and interaction

- **Default:** A sorted column, one inspected row, one selected row, a removed row and all four chip tones.
- **Panel:** The variant inside a working-page panel: plain headers, 48 px rows and no row pointer.
- **No matches:** Rows exist but none match; the message says how to bring them back.
- **Loading:** First read in progress: no rows, and no result is inferred.

## Specificity

`src/components/ui/register-table.css` starts every rule with `:is(.ppo-register, #ppo-shared)` (or the chip or footer root). No element carries `#ppo-shared`. Inside `:is()` it gives each rule an id's weight, so the table keeps its look against the id-scoped element resets of the shared workspaces (`#ppo-… button { padding: 0 }` in `my-work.css`) and the global `button:hover` rule. A module that must adjust the table on purpose uses its scope id with a class. The stylesheet loads after the module stylesheets, so the chip's icon size wins its tie with a workspace's own icon rule.

Class names: `ppo-register-title` already exists in `shared-layout.css` as a visually hidden register page heading, so the row title is `ppo-register-row-title`. Check for a collision before adding a class here.

## Differences and limits

No sticky header, scroll edge shadows, column resizing or phone row layout yet. The host owns data, sorting, paging and selection, and supplies chip icons from its own icon set.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

When a module adopts the table, record its departures first, keep its tests' behaviour, and remove its copy of the rules in the same PR.
