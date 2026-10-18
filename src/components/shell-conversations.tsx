"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePlatformResource } from "./platform-resource";
import { useShell } from "./shell-provider";
import { ShellIcon } from "./shell-icon";
import { conversationsChanged } from "../conversations/events";
import { conversationBadgeLabel } from "../conversations/badge";

type Badge = { unread_threads: number };

// D1 and D2 (PPO-CONV-T1C-DESIGN 10.1): the top bar's Conversations action, left of the Page guide on every page and in
// the phone header. Shown to a viewer who holds conversation.read; the badge counts threads they take part in with an
// unread message, and is re-read on focus and after any Conversations command. A failed read shows no badge.
export function ShellConversations() {
  const { context } = useShell();
  const pathname = usePathname();
  const read = usePlatformResource<Badge>(context?.conversations ? "conversations/badge" : null);
  const { reload } = read;
  useEffect(() => {
    window.addEventListener(conversationsChanged, reload);
    return () => window.removeEventListener(conversationsChanged, reload);
  }, [reload]);
  // A re-read briefly has no data; keep the last count for this identity so the badge does not flash. A failed read or
  // another identity clears it.
  const scope = context?.preference_scope;
  const [kept, setKept] = useState<{ scope?: string; badge?: Badge }>({});
  if (kept.scope !== scope) setKept({ scope });
  else if (read.data && read.data !== kept.badge) setKept({ scope, badge: read.data });
  else if (read.error && kept.badge) setKept({ scope });
  if (!context?.conversations) return null;
  const count = read.error ? undefined : (read.data ?? kept.badge)?.unread_threads;
  const badge = conversationBadgeLabel(count);
  const name = badge ? `Conversations, ${count} unread` : "Conversations";
  const current = pathname === "/conversations" || pathname.startsWith("/conversations/");
  return (
    <Link
      href="/conversations"
      className="ppo-top-action ppo-conversations-action"
      aria-label={name}
      title={badge ? `Conversations · ${count} with new messages` : "Conversations"}
      aria-current={current ? "page" : undefined}
    >
      <ShellIcon name="conversations" />
      {badge && <span className="ppo-top-badge" aria-hidden="true">{badge}</span>}
    </Link>
  );
}
