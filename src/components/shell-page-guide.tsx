"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { GuideArticle } from "../guides/render";
import { guideForPath } from "../guides/released";
import { useReleasedGuides } from "../guides/provider";
import { usePageDescription } from "../shell/page-description";
import { ShellIcon } from "./shell-icon";

// The page guide panel (ADR-0065). The guides are the released Markdown guides under docs/guides, which the root
// layout supplies through GuideLibraryProvider; the route decides the page's guide. A page with no visible guide shows
// the fallback, and the application shell guide is one button away.
export function ShellPageGuide({ page }: { page: string }) {
  const released = useReleasedGuides();
  const pageGuide = guideForPath(released, usePathname() ?? "");
  // A register that gave up its visible description publishes it here, so the information icon keeps it.
  const published = usePageDescription();
  const [showShell, setShowShell] = useState(page === "Application shell");
  const shell = released.shell;
  const shellLink = shell && <button className="ppo-guide-link" onClick={() => setShowShell(true)}><ShellIcon name="info" /><span>Read the application shell guide</span><ShellIcon name="chevron-right" /></button>;
  if (showShell && shell) return <GuideArticle guide={shell} eyebrow="User guide" />;
  if (!pageGuide) return <div className="ppo-page-guide">
    <div className="ppo-guide-intro"><span className="ppo-guide-eyebrow">Page guide</span><h3>{page}</h3><p>{published?.description ?? `The detailed ${page} guide is being prepared.`}</p></div>
    {published && <p className="ppo-panel-hint">The detailed {page} guide is being prepared.</p>}
    <div className="ppo-guide-note">The page guide will explain its purpose, how to use it, the journey through its key tasks and where to go next.</div>
    {shellLink}
  </div>;
  return <GuideArticle guide={pageGuide} eyebrow="Page guide">{shellLink}</GuideArticle>;
}
