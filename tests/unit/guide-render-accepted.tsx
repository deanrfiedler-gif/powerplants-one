import type { PageGuide } from "../../src/components/leads-guide";

// A verbatim copy of src/components/shell-page-guide.tsx lines 32 to 42 and the article's closing tag: the accepted
// page-guide panel, without the line 43 button that opens the application shell guide. The parity test in
// guide-render.test.ts renders a guide through this copy and through GuideArticle, and the two must match exactly.
// If they differ, fix the renderer in src/guides/render.tsx: never edit this copy to follow it. The eyebrow stands in
// for the expression on line 35, and `guide` for line 33's choice between the page guide and the shell guide.
// The click handlers are copied too, though renderToStaticMarkup never shows them.
const jump = (id: string) => {
  const section = document.getElementById(id);
  section?.focus({ preventScroll: true });
  section?.scrollIntoView({ block: "start", behavior: "instant" });
};

export function acceptedPanel(guide: PageGuide, eyebrow: string) {
  const numbered = (items: readonly (readonly [string, string])[], kind: string) => <ol className={`ppo-guide-${kind}`}>{items.map(([title, text], i) => <li key={title}><span className="ppo-step-number" aria-hidden="true">{i + 1}</span><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol>;
  return <article className="ppo-page-guide">
    <div className="ppo-guide-intro"><span className="ppo-guide-eyebrow">{eyebrow}</span><h3>{guide.title}</h3><p>{guide.intro}</p></div>
    <nav className="ppo-guide-contents" aria-label="Guide sections">{[["overview", "Overview"], ["how", "How to use"], ["journey", "Journey map"]].map(([id, title]) => <button key={id} onClick={() => jump(`ppo-guide-${id}`)}>{title}</button>)}</nav>
    <section className="ppo-guide-section"><h3 id="ppo-guide-overview" tabIndex={-1}>{guide.overviewTitle}</h3><p>{guide.purpose}</p><div className="ppo-guide-features">{guide.features.map(([title, text]) => <div key={title}><h4>{title}</h4><p>{text}</p></div>)}</div></section>
    <section className="ppo-guide-section"><h3 id="ppo-guide-how" tabIndex={-1}>How to use it</h3>{numbered(guide.steps, "steps")}</section>
    <section className="ppo-guide-section"><h3 id="ppo-guide-journey" tabIndex={-1}>Your journey</h3><p>{guide.journeyIntro}</p>{numbered(guide.journey, "journey")}</section>
    <section className="ppo-guide-section"><h3>On your phone</h3><p>{guide.mobile}</p></section>
    <section className="ppo-guide-section"><h3>Keyboard shortcuts</h3><dl className="ppo-guide-shortcuts">{guide.shortcuts.map(([key, text]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{text}</dd></div>)}</dl></section>
    <section className="ppo-guide-section"><h3>If something is unavailable</h3><p>{guide.recovery}</p><div className="ppo-guide-note">{guide.boundary}</div></section>
  </article>;
}
