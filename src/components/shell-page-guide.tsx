"use client";
import { useState } from "react";
import { shellGuide } from "../shell/guide";
import { ShellIcon } from "./shell-icon";

export function ShellPageGuide({ page }: { page: string }) {
  const [showShell, setShowShell] = useState(page === "Application shell");
  const jump = (id: string) => {
    const section = document.getElementById(id);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: "start", behavior: "instant" });
  };
  if (!showShell) return <div className="ppo-page-guide">
    <div className="ppo-guide-intro"><span className="ppo-guide-eyebrow">Page guide</span><h3>{page}</h3><p>The detailed {page} guide is being prepared.</p></div>
    <div className="ppo-guide-note">The page guide will explain its purpose, how to use it, the journey through its key tasks and where to go next.</div>
    <button className="ppo-guide-link" onClick={() => setShowShell(true)}><ShellIcon name="info" /><span>Read the application shell guide</span><ShellIcon name="chevron-right" /></button>
  </div>;
  const numbered = (items: readonly (readonly [string, string])[], kind: string) => <ol className={`ppo-guide-${kind}`}>{items.map(([title, text], i) => <li key={title}><span className="ppo-step-number" aria-hidden="true">{i + 1}</span><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol>;
  return <article className="ppo-page-guide">
    <div className="ppo-guide-intro"><span className="ppo-guide-eyebrow">User guide</span><h3>{shellGuide.title}</h3><p>{shellGuide.intro}</p></div>
    <nav className="ppo-guide-contents" aria-label="Guide sections">{[["overview", "Overview"], ["how", "How to use"], ["journey", "Journey map"]].map(([id, title]) => <button key={id} onClick={() => jump(`ppo-guide-${id}`)}>{title}</button>)}</nav>
    <section className="ppo-guide-section"><h3 id="ppo-guide-overview" tabIndex={-1}>{shellGuide.overviewTitle}</h3><p>{shellGuide.purpose}</p><div className="ppo-guide-features">{shellGuide.features.map(([title, text]) => <div key={title}><h4>{title}</h4><p>{text}</p></div>)}</div></section>
    <section className="ppo-guide-section"><h3 id="ppo-guide-how" tabIndex={-1}>How to use it</h3>{numbered(shellGuide.steps, "steps")}</section>
    <section className="ppo-guide-section"><h3 id="ppo-guide-journey" tabIndex={-1}>Your journey</h3><p>{shellGuide.journeyIntro}</p>{numbered(shellGuide.journey, "journey")}</section>
    <section className="ppo-guide-section"><h3>On your phone</h3><p>{shellGuide.mobile}</p></section>
    <section className="ppo-guide-section"><h3>Keyboard shortcuts</h3><dl className="ppo-guide-shortcuts">{shellGuide.shortcuts.map(([key, text]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{text}</dd></div>)}</dl></section>
    <section className="ppo-guide-section"><h3>If something is unavailable</h3><p>{shellGuide.recovery}</p><div className="ppo-guide-note">{shellGuide.boundary}</div></section>
  </article>;
}
