---
document_id: PPO-SITE-FOLLOW-UP-FOCUS-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Dean chose option (a) on 31 October 2026; built in PR #785; second-model review, screen-reader, device and owner visual review pending
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Keeping keyboard focus when the Site follow-up list refreshes

## Decision

Before this change, the Site page emptied and redrew its Owned follow-up list every 15 seconds (CS-04, `route:/sites/[id]`, Work and visits), and anyone using a keyboard inside the list lost their place each time. Claude asked which of the options below the list should use, and recommended (a). Dean's answer, 31 October 2026: **"Option (a), keep list"**.

**The list stays on screen during a routine refresh. It clears only when a read is denied, fails or stays unanswered past the next one, and it is removed at once when the Follow-ups source turns Restricted or Unavailable.** The conditions below are Claude's recommended rules for building that choice. Dean chose the option they were attached to, without going through them one by one.

This replaces the direction in [PR #715](https://github.com/deanrfiedler-gif/powerplants-one/pull/715), which is open and unmerged, specified option (b) and deferred option (a). That PR's owner, Codex, would amend or close it.

The rest of this record keeps the case as it was put to Dean. Where it says "today", it means the behaviour before this change.

## What the access review required

The review's own wording is not retained. It is not in the PR #659 comments or in the Codex session logs for 21 and 22 October. The evidence is [its status record](../status/2026-10-22-open-pr-integration-validation.md) and commit 41eb6cea. The finding was that "a refreshed Restricted source left the non-refreshing child mounted".

| Guarantee | Where it comes from | Needs the list emptied on every refresh? |
| --- | --- | --- |
| A Restricted or Unavailable Follow-ups source removes the list at once | The finding; the source check at `site-workspace.tsx:512` | No, the source check does this |
| A late reply cannot bring removed rows back | The fix; `useResource` ignores replies after unmount | No |
| The list must keep re-reading, not stay frozen | "Non-refreshing child" in the finding | Needs a re-read, not an empty list in the meantime |
| A failed current read removes displayed data | [Site record register](../design/development/pages/route-sites-id.md) | No, this applies to failures only |

Emptying the list is a by-product of how the re-read was triggered: `key={observation}` in `RelatedActivities`. The register text says the reads "refresh" and that the read "remounts". The word "clearing" appears in the status record, and `sites-native.spec.ts:100` asserts it because the remount did it. That is my reading of the evidence, not something the reviewer stated.

The empty list adds little protection:

- **The window barely changes.** A row revoked just after a check stays visible for up to 15 seconds under any option. Emptying the list only removes old rows for the length of one further read, which was about 300 ms in the test below.
- **The same rows stay elsewhere on the tab.** The Overview's own preview of ten active follow-ups sits above the list and stays up through every refresh, because `useCrmResource` keeps its data while it re-reads.
- **One real difference.** `api()` has no timeout, so a read that hangs leaves an empty list today but would leave old rows under option (a). Condition 3 below deals with this.

## What users experience today

I measured the real Site page on 31 October 2026: a dev server at 1440 px, in Chrome driven by Playwright, with synthetic reads and a 50-item page. "Next linked activities" exists only when a page is full, so 50 stops is the normal case, not the worst one. The default page size is 50 (`src/shared/reads.ts`).

**Focus is lost every 15 seconds.** With focus parked on a list link and no input, it fell to the document 4 times in 60 seconds, at 13.4, 28.4, 43.4 and 58.4 s.

**Tabbing forward from the first list link to Next,** stopping after 150 seconds:

| Pace | Today, 150 ms read | Today, 1.5 s read | Prototype of (a), either read time |
| --- | --- | --- | --- |
| 1 Tab a second | Not reached; got to link 16 | Not reached; link 12 | Reached in 49.6 s |
| 2 a second | Not reached; link 29 | Not reached; link 27 | Reached in 25.0 s |
| 3 a second | Not reached; link 43 | Not reached; link 36 | Reached in 16.9 s |
| 5 a second | Reached in 10.4 s | Reached in 10.4 s | Not rerun |
| 8 a second | Reached in 6.7 s | Reached in 6.7 s | Not rerun |

The limit is 50 stops in 15 seconds, or 3.3 Tabs a second. The 5 and 8 per second runs started just after a refresh, so a walk that starts later in the cycle can be interrupted once before it succeeds.

**Where the next Tab goes:**

- After the read finishes, it goes to the first link in the list. A user at link 30 loses 29 stops.
- During the read, it leaves the page.
- Coming back into the page fires the window focus event, which triggers another refresh (seen in two window blur/focus pairs and three Overview reads during one backward walk). So Shift+Tab from the top of the page is no workaround: 3 of 3 settled runs never reached Next in 40 to 60 presses, and the first fell past the list the same way.

**Activating Next removes the focused button.** Focus falls to the document while the next page loads. A Tab after the page arrives lands on its first link, which is acceptable. A Tab during the load leaves the page. This happens under every option unless it is fixed separately (condition 5).

**Mouse users see it too.** With a 300 ms read, the list disappeared for 337 ms, the section shrank from 6,853 px to 64 px, and the scroll position dropped from 4,657 to 261 before returning. Slower reads blank it for longer.

I read this as conflicting with WCAG 2.2 success criteria 2.1.1 (no keystroke timing requirements) and 2.4.3 (focus order). It is not a formal audit. Criterion 2.2.2 on auto-updating content stays a separate question, as PR #715 also says.

## Other screens

No other screen has this problem in this form.

| Screen | Key | Why it differs |
| --- | --- | --- |
| Travel review, Demand & capacity (`review-workspaces.client.tsx:159`, `:386`) | Search plus `observed_at` | `useResource`, no timer; remounts only on "Refresh" or a filter change |
| Field team person snapshot (`field-team-screen.client.tsx:887`) | Person plus `observed_at` | Same |
| All other `useCrmResource` screens | No per-read key | The hook keeps data on screen while polling |

Seen in passing, read from the code only, not measured and not changed here:

- The 30-second refresh in `useFacilityPages` restarts at the first page (`facility-controls.tsx`), so it may collapse pages opened with "More".
- `WorkTimer` passes `retained` to `ReadState` on a 15-second reload, which may repeat its status text.
- Other hosts of `RelatedActivities` (`context-screens.tsx:539`, `:790`) never re-read. This is the "non-refreshing child" again, on other record pages.

## Options

| | (a) Keep the list during a routine refresh | (b) Keep clearing, restore focus afterwards | (c) Re-read only when the source state changes |
| --- | --- | --- | --- |
| **Keyboard focus** | Never moves on a routine refresh (measured) | Moves to the heading and back on every refresh | Never moves |
| **Reach Next at 1 to 3 Tabs a second** | Yes (measured) | Only if no key is pressed during a read | Yes |
| **List blanking and scroll jump** | Gone (measured: 0 ms, height and scroll unchanged) | Stays | Gone |
| **Row-level revocation** | Cleared on the next answered read; old rows stay for one read longer than today | Same as today | **Not detected** |
| **Restricted or Unavailable source** | Removed at once (measured) | Removed at once | Removed at once |
| **Failed or denied list read** | Cleared (measured) | Cleared | Not re-read, so not seen |
| **New work and status changes in the list** | Within 15 s | Within 15 s | **Not until the user leaves the page** |
| **Size** | About 25 lines added or changed in the prototype, before the conditions below | PR #715 adds about 130 lines of rules: bookmarks, cancellation, window-return handling | Small |
| **`sites-native.spec.ts`** | Line 100 flips | Unchanged, new spec added | Line 100 and the re-read proof change |

**(b) is PR #715.** It parks focus on the heading during the read and restores it only if every guard passes. It is careful work, and the access position is unchanged. Three costs remain:

- A key pressed during the read cancels restoration, by that PR's own rules. At 1 Tab a second with a 1.5 s read, that happens at every refresh. With a 150 ms read it is about a 4 in 10 chance over a 50-second walk (my calculation, not a measurement). So reaching Next stays unreliable for the slowest users.
- The blanking and scroll jump stay for everyone.
- Focus moving twice every 15 seconds is likely to make a screen reader speak twice each time. That is my inference and needs a real screen-reader check.

PR #715 deferred (a) because retaining rows "conflicts with the current clear-while-rereading contract", and because removing the key removes the re-read trigger. The section above shows that contract is a by-product, not a requirement. The trigger survives because `useCrmResource` has its own 15-second and window-focus re-read.

**(c) is the option I would reject.** The Follow-ups state only reports whether the read worked and whether more than ten active items exist (`sites.ts:219`). Each activity is filtered individually (`activityVisibility`), including on the visibility of everything it links to. One row can therefore become hidden while the state stays the same, and that row would stay on screen indefinitely. That is the gap the review found, in a different form.

## Conditions, and how each was built

1. **A routine refresh is silent.** The list, focus and scroll position stay, and no loading message appears. The 15-second and window-focus re-reads continue. Use the existing quiet refresh (`useCrmResource`, also the pattern in My Work's `useWorkResource`), for the Site host only. Do not use the `retained` notice: it would speak every 15 seconds, and it applies to data kept after a failure, which this page forbids.
2. **Every denied or failed read clears the list** (`clearOnError`), and a Restricted or Unavailable source removes it at once. Both rules are unchanged.
3. **Old rows have a time limit.** If a re-read is still unanswered when the next one is due, clear the list. This caps a hung read at about 30 seconds, against about 15 today. The prototype did not include this.
4. **Focus has somewhere to go when rows do vanish.** A focused control that is removed from the list moves focus to the Owned follow-up heading, which stays mounted. If the whole list is removed because the source turned Restricted or Unavailable, focus moves to the Work and visits heading. A background failure no longer takes focus from someone working elsewhere (`focusOnError={false}`). The error is still announced as an alert.
5. **Next and First move focus to the heading** while the page loads (PR #715 item 9). Measured in the prototype: focus stays on the heading, and the next Tab lands on the new page's first link.

**Not built.** If the whole Overview read fails, the Site record is removed and focus still falls to the document. PR #715 item 1 proposes a persistent "Site view" target for this. It would change focus on every Site tab, and review of that PR raised that scope as a question, so it needs its own change. The explanation PR #715 item 9 proposes when the list returns on its first page is also not built.

PR #715's items 2 to 5 and its window-return section are no longer needed. This change does not touch that branch.

## Evidence

Before Dean chose, I tried a temporary prototype locally, then removed it. It is not on any branch. The results below are from that prototype, which is why it has the defect described after the table.

| Check | Result |
| --- | --- |
| Routine refresh with focus on a link | Focus unchanged; list never left the screen; no loading text in any frame |
| Next Tab during a 1.5 s read | Moved from link 30 to link 31 |
| One row disappears, source state unchanged | Row gone after the next read |
| List read answers 403 with focus inside | List gone; focus on the error |
| List read answers 500 | List gone; error shown |
| Source turns Restricted while the list read hangs | Section gone at once; the late reply restored nothing |
| `sites-native.spec.ts`, CS-04 follow-up case, unchanged | Fails only at line 100, the assertion that a routine refresh empties the list |
| The same case with line 100 flipped to expect the row to stay | Passes, including the Restricted and late-reply assertions |
| `quality-owned-follow-up.spec.ts`, unchanged | Passes |

The prototype moved focus to the error even when focus had moved outside the list, because it lost track after the Retry button was removed. The build corrects this, and `tests/browser/sites-follow-up-focus.spec.ts` covers it.

**The build,** in `tests/browser/sites-follow-up-focus.spec.ts`, has six cases, run on desktop (1440 px) and phone (390 px) viewports against the dev server with synthetic reads:

- A routine refresh keeps rows, focus and scroll, with no loading message.
- A keyboard walk reaches Next across a refresh, and paging keeps focus on the list.
- A row that is no longer permitted goes, with the source state unchanged.
- A denied or failed read clears the list and moves only the focus it displaced.
- A Restricted source removes the list at once, and a late reply restores nothing.
- Rows clear when a re-read is still unanswered as the next falls due.

All six pass on the new code and all six fail on the previous code. The pace table above is from the prototype and was not rerun on the build, whose walk runs at test speed with a forced refresh.

**Not checked:** a screen reader, the compiled application, the live API or a real operating-system window switch. Playwright's focus handling may differ from a real window, so the window-focus result needs a manual check. Reads were synthetic, and the dev server repeats first reads under React StrictMode.

## What changed

- **Application:** `RelatedActivities` takes `live` in place of `observation`, and only the Site host passes it. `useCrmResource` gains an optional `clearUnanswered`, and `record-ui.tsx` gains `useFocusFallback`. Other consumers of `useCrmResource` behave as before. Other `RelatedActivities` hosts keep their single read, but share the page-turn focus change and the focusable heading.
- **Tests:** `sites-native.spec.ts` now proves the rows stay during a held re-read, and its Restricted and late-reply assertions are unchanged. `tests/helpers/owned-follow-up.ts` no longer retries a walk, and `quality-owned-follow-up.spec.ts` keeps its forced refreshes as a guard against the old failure.
- **Design register:** `route-sites-id.md` and the CS-04 paragraph in `read-state.md` are corrected in place. No Figma change. Owner visual review stays pending.
- **Records:** the [status fragment](../status/2026-10-31-site-follow-up-focus-proposal.md) closes the open question in the [25 October fragment](../status/2026-10-25-p11-journey-pages-site-follow-ups-across-cs-04-refreshes.md).

No API, permission or migration changes. This record claims no accessibility conformance or business acceptance. It has not yet had the review by a second model that an owner decision paper needs before merge.
