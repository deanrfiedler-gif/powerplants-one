# Compact phone header: measured evidence

<!-- versioning: git; committed history is authoritative -->

**Decision:** [PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC](../../../decisions/phone-header-amendment.md), rules P1–P9. **Change:** draft PR #609. **Review:** owner review of the running app against the Figma component "Shell / Phone header · compact" (`1530:110`) is pending; this is functional and geometric evidence, not acceptance.

## How it was measured

On 19 October 2026 the branch's own development server (a disposable synthetic PostgreSQL 16 cluster, migrations and seed applied, synthetic identities only) was driven by headless Chromium 156 with a touch phone profile at 390 × 844 and then 320 × 844. Each page was signed in through the local-session API; bounding boxes and computed styles come from `getBoundingClientRect` and `getComputedStyle` on `header#shell-header`. The conversation thread was created through the real API. Chromium here did not load the Font Awesome Kit, so the screenshots used the local icon drawings; the Kit icons are the same size boxes.

## Figma values compared

The component's List and Record variants at Width=390 and Width=320 are a 56 px row with 4 px side padding, 44 × 44 targets, a 20 px bold title (18 px at 320), a 16 px count, and a 16 px medium record reference. The application row matches on each:

| Page | Width | Row | Header | Lead control | Title (size, truncated) | Conversations | Smallest control | Page scroll width |
|---|---|---|---|---|---|---|---|---|
| My Work (view chooser) | 390 | list | 56 px | Menu 44x44 at x=4 | 20px, no | Conversations, 1 unread at x=342 | 44 px | 390 |
| My Work (view chooser) | 320 | list | 56 px | Menu 44x44 at x=4 | 18px, no | Conversations, 1 unread at x=272 | 44 px | 320 |
| Conversation thread (record) | 390 | record | 56 px | Back to Conversations 44x44 at x=4 | 16px, no | not shown | 44 px | 390 |
| Conversation thread (record) | 320 | record | 56 px | Back to Conversations 44x44 at x=4 | 16px, no | not shown | 44 px | 320 |
| Conversations (title only) | 390 | list | 56 px | Menu 44x44 at x=4 | 20px, no | Conversations at x=342 | 44 px | 390 |
| Conversations (title only) | 320 | list | 56 px | Menu 44x44 at x=4 | 18px, no | Conversations at x=272 | 44 px | 320 |
| Organisations (title only) | 390 | list | 56 px | Menu 44x44 at x=4 | 20px, no | Conversations, 3 unread at x=342 | 44 px | 390 |
| Organisations (title only) | 320 | list | 56 px | Menu 44x44 at x=4 | 18px, no | Conversations, 3 unread at x=272 | 44 px | 320 |
| Deals (retained search row) | 390 | list | 103 px | Menu 44x44 at x=4 | 20px, no | Conversations, 3 unread at x=342 | 44 px | 390 |
| Deals (retained search row) | 320 | list | 103 px | Menu 44x44 at x=4 | 18px, no | Conversations, 3 unread at x=272 | 44 px | 320 |
| Released Materials (long title) | 390 | list | 56 px | Menu 44x44 at x=4 | 20px, yes | Conversations, 3 unread at x=342 | 44 px | 390 |
| Released Materials (long title) | 320 | list | 56 px | Menu 44x44 at x=4 | 18px, yes | Conversations, 3 unread at x=272 | 44 px | 320 |

## Behaviour checked in the same runs

- Menu opens the existing More dialog; its first control is global search, then the account row (name and working company). Choosing search, Page guide or Account opens the same panel as before; Escape or Close returns focus to the Menu button.
- On My Work the view chooser (name "Choose view. Current view: My Work") opens the page's menu sheet, sets `aria-expanded`, and Escape returns focus to the chooser.
- The Conversations badge and name read "Conversations, N unread"; a record row hides Conversations as drawn.
- The Deals page keeps its deal-search row beneath the 56 px row, so its header is 103 px until that page is next changed (P9).
- Desktop widths still draw the three-zone top bar: the compact parts are hidden above 780 px.

## Not covered

- No page registers a page action, Filter or record previous/next yet, so those parts are not exercised by any application page and no committed test drives them. They were checked once on a temporary local probe page (not committed): at 390 px a list row showed Menu, the view chooser ("To send", count 3, chevron), a page action, Conversations and Filter with its applied dot, each 44 × 44; at 320 px a search page action and Filter became one "Search and filter, a filter is applied" control (Conversations kept, three icons at most); a record row showed Back, the position, Previous, Next and More actions at 390 px and Back, the position and More actions at 320 px, with Previous and Next inside More. Each control called its handler.
- The unread-notification dot on Menu appears about ten seconds after a phone page loads (or once the menu has been opened) because the inbox read is deliberately not made on every page load; with the synthetic coordinator identity it showed after the delay, with exactly one inbox read and none on focus. It is not instant, and a lightweight unread-count read would remove the delay.
- On a record page the row has Back instead of Menu (as drawn in Figma), so the menu is reached from the tab bar's More; the browser specs for the Page guide on record routes (Equipment, Maintenance) go through More there and focus returns to it. If record pages drop the tab bar (P3), they will need another way to the menu.
- Real devices, screen readers and zoom are not checked. Dean's persistent development database held no `conversation.*` grants when it was read (zero rows), so the Conversations action does not show there until it is migrated and seeded; it was not changed.
