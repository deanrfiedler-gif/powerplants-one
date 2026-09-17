// Based on the authored r17 shell guide; connected behaviour replaces preview-only statements.
export const shellGuide = {
  "title": "Application shell",
  "intro": "Your shared starting point for Powerplants One. Use the shell to find a page, move between workspaces and reach guidance without losing your place.",
  "purpose": "The shell provides the navigation, search, account and support controls used across the application. Each module supplies the working area beneath this header.",
  "features": [
    [
      "Find your way",
      "Open More for the seven business workspaces and shared pages. Search the menu when you know the destination name."
    ],
    [
      "Know where you are",
      "The template starts with Powerplants One. Opening a page adds its name to the heading, such as Leads or Projects."
    ],
    [
      "Get the right help",
      "Use the information icon for the current page’s detailed guide and journey. Quick Help provides short shell tips and keyboard shortcuts."
    ]
  ],
  "steps": [
    [
      "Choose a destination",
      "Open the three-dot More menu. Select a workspace or shared page, or type a name into the menu’s search field. The current page is marked when you reopen the menu."
    ],
    [
      "Use global search",
      "Click the search field or press Ctrl/Cmd K. Choose a page, or type at least two characters to search the business records you can access."
    ],
    [
      "Review a workspace",
      "Open your account, then Development → Preview workspace. Select a domain to open its available workspace. Your preference is remembered on this browser; it does not change your identity or permissions."
    ],
    [
      "Create when connected",
      "Quick add is the navy plus to the right of search. Choose an available action to open its creation form. Review and save in that form; selecting an action does not create a record."
    ],
    [
      "Find guidance and updates",
      "Open the information icon for the current page guide. Use Quick Help for short tips and Notifications for updates when that service is connected. Close a panel with its close button or Escape."
    ]
  ],
  "journey": [
    [
      "Start",
      "Powerplants One opens My Work with your permitted activities and the shared application frame."
    ],
    [
      "Find a page",
      "Use More or global search to choose your destination."
    ],
    [
      "Confirm your context",
      "Read the page name in the header. Mobile navigation follows the selected workspace."
    ],
    [
      "Work with guidance",
      "Open the information icon for that page’s guide, then return to the same page. Business work takes place in the connected module."
    ]
  ],
  "mobile": "On a phone, use My Work, the two workspace-specific destinations and More in the bottom bar. Information, search and your account remain in the header. Quick add, Quick Help and Notifications are also available from More.",
  "recovery": "If search finds no pages, clear it and try a shorter name. If browser storage is unavailable, the selected workspace applies to this visit. Reset preview preference in your account restores Sales without changing the current user or access rights.",
  "shortcuts": [
    [
      "Ctrl / Cmd K",
      "Open search"
    ],
    [
      "Escape",
      "Close the current picker or panel"
    ],
    [
      "↑ / ↓",
      "Move through search results or workspace choices"
    ],
    [
      "Enter / Space",
      "Activate the focused button"
    ],
    [
      "Tab / Shift Tab",
      "Move between available controls"
    ]
  ],
  "boundary": "Business records are saved by their own module. A preview selection does not grant access. Notifications and additional page guides become available as their source modules are connected.",
  "overviewTitle": "What this shell does",
  "journeyIntro": "From opening Powerplants One to reaching the right page."
} as const;
