---
guide_key: guide.system.shell
entry_key: system:shell
also_applies_to: []
carried_over_from: src/shell/guide.ts
# Refined S1 instructions await release review in
# docs/design/development/component-bindings/2026-11-08-shell-refined-s1.md.
# Preserve this carried-over guide and its parity fixture while legacy is default.
title: Application shell
status: InReview
shown_before_review: true
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: b95d335987ee3b8f2c9f19509e7832c5200db67d
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---

Your shared starting point for Powerplants One. Use the shell to find a page, move between workspaces and reach guidance without losing your place.

## What this shell does {#overview}

The shell provides the navigation, search, account and support controls used across the application. Each module supplies the working area beneath this header.

### Find your way

Open More for your permitted business workspaces and shared pages. Search the menu by page name or a synonym such as Opportunity or Customer.

### Know where you are

The breadcrumb names the current page and, when the page sits beneath a list or module, that list as a link back. A loaded record shows its permitted exact reference; its title stays in the record header. The rail shows your department, and Page hierarchy shows the full path. Identity is never guessed from a URL.

### Work in one company

If your access reaches more than one company, open your account and choose a working company. Pages, search and actions then show only that company's records, and the account button shows a dot and names the company in its tooltip. Your permissions are unchanged; choose All companies to see everything you can access again.

### Get the right help

Use the information icon for the current page’s detailed guide and journey. Quick Help provides short shell tips and keyboard shortcuts.

## How to use it {#how}

1. **Choose a destination**\
   Open the three-dot More menu. Select a workspace or shared page, or type a name into the menu’s search field. The current page is marked when you reopen the menu.
2. **Use global search**\
   Click the search field, which sits in the same place at the centre of the top bar on every page, or press Ctrl/Cmd K. Choose a page, or type at least two characters to search the business records you can access.
3. **Review a workspace**\
   Open More and choose a department under Workspaces. Each offered department has an eligible operational destination. Expand primary navigation on desktop for readable labels; longer rails, such as Service operations, are grouped under headings. Preferences are remembered per identity/browser and never change permissions.
4. **Create when connected**\
   Quick add is the navy plus to the right of search. Choose an available action to open its creation form. Review and save in that form; selecting an action does not create a record.
5. **Find guidance and updates**\
   Open the information icon for the current page guide. Use Quick Help for short tips and Notifications for updates when that service is connected. Close a panel with its close button or Escape.

## Your journey {#journey}

From opening Powerplants One to reaching the right page.

1. **Start**\
   Home opens My Work when permitted, otherwise an eligible operational landing. An identity without destinations sees a clear access state.
2. **Find a page**\
   Use More or global search to choose your destination.
3. **Confirm your context**\
   Read the page name in the header; on a phone it names the current view. Mobile navigation follows the selected workspace.
4. **Work with guidance**\
   Open the information icon for that page’s guide, then return to the same page. Business work takes place in the connected module.

## On your phone {#mobile}

On a phone, the header is one row. Open the menu at its left (or More in the bottom bar) for search, your account and working company, departments under Workspaces, Notifications, the page guide, Quick add and Help; a dot on the menu means unread notifications. The title names the current page or view: where it shows a chevron, open it to choose a view. Conversations stays in the row, and a page may add one action and Filter. On a record, the row shows back and the record reference, with More for its actions. The Sales bar offers up to four destinations and More; other workspaces offer up to three destinations and More, filtered by current access.

## Keyboard shortcuts {#shortcuts}

| Key | Action |
|---|---|
| `Ctrl / Cmd K` | Open search |
| `Escape` | Close the current picker or panel |
| `↑ / ↓` | Move through search results or workspace choices |
| `Enter / Space` | Activate the focused button |
| `Tab / Shift Tab` | Move between available controls |

## If something is unavailable {#recovery}

If search finds no pages, clear it and try a shorter name. If browser storage is unavailable, the selected workspace applies to this visit. Choosing a department under Workspaces opens an eligible department page. A cancelled leave review keeps your current page and preference. Changing the working company also reviews unsaved work first; if a record seems missing, check the working company in your account. Development Shell preview is separate from operational selection and never changes access rights.

> [!NOTE]
> Business records are saved by their own module. A preview selection does not grant access. Notifications and additional page guides become available as their source modules are connected.
