"use client";
// The Conversations workspace (PPO-CONV-T1C-DESIGN 5.2, 5.7): the sidebar stays mounted while the thread changes. The
// list is read once here, re-read every 30 seconds while the page is visible, on focus and after any command.
import { createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePlatformResource } from "../../components/platform-resource";
import type { ThreadSummary } from "../reads";
import { ThreadSidebar } from "./thread-sidebar";

export const conversationsChanged = "ppo-conversations-changed";
export const announceConversationsChanged = () => window.dispatchEvent(new Event(conversationsChanged));

type ThreadList = { items: ThreadSummary[]; count: number };
type Workspace = { items: ThreadSummary[] | undefined; loading: boolean; error: unknown; reload: () => void };
const WorkspaceContext = createContext<Workspace>({ items: undefined, loading: true, error: undefined, reload: () => {} });
export const useConversationList = () => useContext(WorkspaceContext);

// Re-reads while the page is visible: the cadence the design register uses, with no live push in T1.
export function useVisibleRefresh(reload: () => void, every = 30000) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") reload();
    }, every);
    window.addEventListener(conversationsChanged, reload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(conversationsChanged, reload);
    };
  }, [reload, every]);
}

export function ConversationsWorkspace({ children }: { children: React.ReactNode }) {
  const read = usePlatformResource<ThreadList>("conversations?filter=All&limit=100");
  useVisibleRefresh(read.reload);
  const path = usePathname();
  const current = /^\/conversations\/([^/]+)$/.exec(path)?.[1] ?? null;
  const items = read.data?.items;
  return (
    <WorkspaceContext.Provider value={{ items, loading: read.loading, error: read.error, reload: read.reload }}>
      <div className="cv-workspace" data-thread-open={current ? "true" : "false"} data-has-threads={items?.length ? "true" : "false"}>
        <ThreadSidebar items={items} loading={read.loading && !items} error={read.error} reload={read.reload} current={current} />
        <section className="cv-main">{children}</section>
      </div>
    </WorkspaceContext.Provider>
  );
}
