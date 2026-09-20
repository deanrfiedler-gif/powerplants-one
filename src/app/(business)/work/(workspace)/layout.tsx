import { MyWorkShell } from "../../../../activities/components/client/my-work-shell";
// The six My Work views share one secondary menu and one scroll surface. The full activity pages
// (/work/new and /work/:id) sit outside this group and keep the ordinary page frame.
export default function MyWorkLayout({ children }: { children: React.ReactNode }) {
  return <MyWorkShell>{children}</MyWorkShell>;
}
