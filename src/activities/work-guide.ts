// Page guide for the My Work overview (S9, adopted 9 October 2026), shown from the shell
// information icon. Written against the page as built; the register keeps it a draft until the
// owner reviews it in the running app.
import type { PageGuide } from "../components/leads-guide";

export const myWorkGuide: PageGuide = {
  title: "My Work",
  intro: "Your activities, reviews and follow-ups from every department in one place, with what is late at the top.",
  overviewTitle: "What you see",
  purpose:
    "My Work gathers the work you own or follow, so you can see what is late, what is due today and what is waiting on someone else. It shows only records your access covers.",
  features: [
    ["The summary strip", "Counts what is overdue, due today, waiting on someone else, and deals with no next activity. Select a count to see those items."],
    ["My activities", "Lists your overdue and today's activities, most urgent first."],
    ["Today's schedule", "Shows your appointments for today. Times are in AEST (UTC+10)."],
    ["Waiting on others", "Lists requests you are following up."],
    ["Needs a next activity", "Lists your open deals with nothing planned. A banner appears when activities still need a due date."],
  ],
  steps: [
    ["Finish an activity", "Select Complete on its row and record the outcome."],
    ["Move it", "Select Reschedule and choose a new date and time."],
    ["Open it", "Select its title to see the contact details, the record it belongs to and its history."],
    ["Add one", "Select Activity, or the + button on a phone."],
    ["Set missing dates", "Select Set dates in the banner."],
  ],
  journeyIntro: "Views and filters change what the overview shows; the side menu opens the other My Work pages.",
  journey: [
    ["Choose whose work", "Choose My work or Everyone I can see, if your access allows it."],
    ["Narrow the list", "Filters narrow by type and source."],
    ["Save a view", "Save a combination as a view and pin it in the side menu."],
    ["Choose the cards", "Customise chooses which cards appear on the overview."],
    ["Go further", "The side menu opens My actions (everything, not only today), Reviews & handovers, Blocked & waiting, Team queue, and Updates & preferences."],
  ],
  mobile:
    "On a phone the same work appears as Quick actions, Needs attention, a weekly agenda and Waiting on others. The + button adds an activity, and the My Work menu opens the other pages.",
  shortcuts: [
    ["Ctrl K", "Search"],
    ["Esc", "Close a panel"],
  ],
  recovery:
    "If a count looks too low, the footer shows when the page was last updated: select Refresh, or reload the page. If something is missing, remember you see only records your access covers; if you work in one company, items from other companies are not shown, and you can change that in the account panel. If a source is unavailable, the page names it and keeps the rest. Nothing missing is counted as zero.",
  boundary: "My Work lists and links your work. Each record's own page decides what you can change, and checks your access again when you save.",
};
