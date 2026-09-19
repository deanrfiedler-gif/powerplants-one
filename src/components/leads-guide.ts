// Page guide content for the Leads workspace, shown from the shell information icon.
export type PageGuide = {
  title: string;
  intro: string;
  overviewTitle: string;
  purpose: string;
  features: readonly (readonly [string, string])[];
  steps: readonly (readonly [string, string])[];
  journeyIntro: string;
  journey: readonly (readonly [string, string])[];
  mobile: string;
  shortcuts: readonly (readonly [string, string])[];
  recovery: string;
  boundary: string;
};
export const leadsGuide = {
  title: "Leads",
  intro:
    "Your inbox for new enquiries. Work through each lead, keep the next action current, and convert the ones worth pursuing into deals.",
  overviewTitle: "What this page is for",
  purpose:
    "A lead is an enquiry that has not yet become a deal. This page lists the leads you are permitted to see, in the order you choose, so you can triage new enquiries and keep the follow-up honest. Leads you cannot access are never shown.",
  features: [
    [
      "Four working views",
      "Inbox holds the leads still in play. Archived holds ones set aside, Disqualified holds ones ruled out, and Converted holds ones that became deals. Switch views with the four icons at the top left.",
    ],
    [
      "The next activity column",
      "Every lead shows its next scheduled action. Overdue dates and leads with nothing scheduled are marked, so the list doubles as your follow-up queue.",
    ],
    [
      "A table you control",
      "Choose which columns appear, drag the dividers to resize them, and scroll sideways when you need more. Your layout is remembered for you on this device.",
    ],
  ],
  steps: [
    [
      "Add a lead",
      "Use the + Lead button. Record the title, the organisation or contact, and where the enquiry came from. The arrow beside the button will hold bulk import once that is available.",
    ],
    [
      "Narrow the list",
      "Everyone switches between all leads and your own. Filters holds a search box plus status and source, and shows a count when any are active. Clear filters resets them.",
    ],
    [
      "Choose your columns",
      "The gear at the right of the header row opens the column chooser. Search for a column, tick the ones you want, and untick the rest. Reset columns in the footer restores the defaults.",
    ],
    [
      "Act on a lead",
      "Open a lead by its title to read the full record, add a note or set the next action. The three-dot menu at the end of each row converts, archives or disqualifies without opening it first.",
    ],
    [
      "Convert when it is real",
      "Converting creates the linked deal and moves the lead into the Converted view. The lead stays readable afterwards, so the history of the enquiry is not lost.",
    ],
  ],
  journeyIntro:
    "Most enquiries follow the same path through this page. Each step leaves a record, so anyone picking the lead up later can see what happened.",
  journey: [
    [
      "An enquiry arrives",
      "The lead appears in Inbox with no next activity, which marks it as needing attention.",
    ],
    [
      "You make contact",
      "Set the status as the conversation progresses, and schedule the next action so the lead stops looking unattended.",
    ],
    [
      "You qualify it",
      "Keep working it, or disqualify it with a reason. Disqualified leads stay searchable and can be reopened.",
    ],
    [
      "It becomes a deal",
      "Convert the lead. The deal carries the enquiry forward and the lead moves to Converted.",
    ],
    [
      "Or you set it aside",
      "Archive leads that are genuinely dormant rather than dead. They can be restored from the Archived view at any time.",
    ],
  ],
  mobile:
    "On a phone the table is replaced by a card list. The top bar carries the view selector with search, sort and filter buttons beside it, and the + button at the bottom right adds a lead.",
  shortcuts: [
    ["Tab", "Move through the toolbar, the table and each row menu."],
    ["← →", "Resize the focused column by 10 pixels; hold Shift for 50."],
    ["Home / End", "Set the focused column to its narrowest or widest."],
    ["Esc", "Close an open menu, or cancel a column drag in progress."],
  ],
  recovery:
    "If the list cannot load, the page says so and offers to try again rather than showing a stale or partial list. A lead you cannot open is a permission boundary, not a fault.",
  boundary:
    "This page shows only the leads your access allows, and every action is checked again on the server when you save.",
} as const;
