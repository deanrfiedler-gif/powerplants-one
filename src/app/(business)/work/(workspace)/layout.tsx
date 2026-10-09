import { MyWorkShell } from "../../../../activities/components/client/my-work-shell";
// The six My Work views and the activity pages (/work/new and /work/:id) share one secondary menu
// and one scroll surface, so the menu stays in place when an activity is opened (batch 2, S8).
export default function MyWorkLayout({ children }: { children: React.ReactNode }) {
  return <MyWorkShell>{children}</MyWorkShell>;
}
