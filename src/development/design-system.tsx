"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "../components/ui/button";

export function DesignSystem({
  tokens,
  consumers,
}: {
  tokens: { name: string; value: string }[];
  consumers: { key: string; title: string; path: string | null }[];
}) {
  const navy = tokens.find((t) => t.name === "--navy")?.value || "#242a37";
  const sourceRadius = String(
    parseFloat(tokens.find((t) => t.name === "--radius-control")?.value || "6"),
  );
  const [preview, setPreview] = useState(navy),
    [radius, setRadius] = useState(sourceRadius),
    [message, setMessage] = useState("No example action selected.");
  function exportProposal() {
    const data = {
      status: "Proposed; not applied",
      changes: {
        "--navy": { before: navy, after: preview },
        "--radius-control": {
          before: tokens.find((t) => t.name === "--radius-control")?.value,
          after: radius + "px",
        },
      },
      source: "src/app/globals.css",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "PPO-theme-change-proposal.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div id="ppo-development" className="studio">
      <header className="studio-heading">
        <div>
          <p className="studio-eyebrow">
            Local design reference · actual application controls
          </p>
          <h1>Theme & shared controls</h1>
          <p>
            These examples use the app’s runtime tokens and reusable components.
          </p>
        </div>
        <Link className="ppo-button" href="/development/page-register">
          ← Design & build
        </Link>
      </header>
      <p className="studio-note">
        The working source is in Git. Sample adjustments below are temporary and
        affect only the preview. Existing page-specific styles remain documented
        migration work.
      </p>
      <section className="studio-section">
        <h2>Preview a proposed adjustment</h2>
        <div className="studio-toolbar">
          <label>
            Navy colour
            <input
              type="color"
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
            />
          </label>
          <label>
            Control corner radius
            <select value={radius} onChange={(e) => setRadius(e.target.value)}>
              {[...new Set(["0", "4", "6", "8", "10", sourceRadius])].map(
                (value) => (
                  <option key={value} value={value}>
                    {value} px
                  </option>
                ),
              )}
            </select>
          </label>
          <Button
            onClick={() => {
              setPreview(navy);
              setRadius(sourceRadius);
            }}
          >
            Reset sample
          </Button>
          <Button onClick={exportProposal}>Export change proposal</Button>
        </div>
        <p>
          Check contrast and all affected pages before accepting a colour
          change. Exporting a proposal does not change the theme.
        </p>
        <div
          className="studio-sample"
          style={
            {
              "--navy": preview,
              "--radius-control": radius + "px",
            } as CSSProperties
          }
        >
          <h3>Buttons and actions</h3>
          <div className="studio-actions">
            <Button
              variant="primary"
              onClick={() =>
                setMessage(
                  "Primary example selected. No business record changed.",
                )
              }
            >
              Primary action
            </Button>
            <Button onClick={() => setMessage("Secondary example selected.")}>
              Secondary
            </Button>
            <Button
              variant="quiet"
              onClick={() => setMessage("Quiet example selected.")}
            >
              Quiet action
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                setMessage(
                  "Destructive-style example only. Nothing was deleted.",
                )
              }
            >
              Danger action
            </Button>
            <Button disabled>Unavailable</Button>
            <Button busy>Saving</Button>
            <ButtonLink href="#component-rules">Link action</ButtonLink>
          </div>
          <p role="status">{message}</p>
          <h3>Forms, selection and status</h3>
          <div className="studio-toolbar">
            <label>
              Record title
              <input placeholder="Synthetic example" />
            </label>
            <label>
              State
              <select defaultValue="Draft">
                <option>Draft</option>
                <option>Ready for review</option>
              </select>
            </label>
            <label className="studio-check">
              <input type="checkbox" />
              Example option
            </label>
          </div>
          <div className="studio-badges">
            <span>Draft · not submitted</span>
            <span>Review pending</span>
            <span>Source changed</span>
          </div>
          <p className="studio-warning">
            Example validation: confirm the source before continuing.
          </p>
        </div>
      </section>
      <section className="studio-section" id="component-rules">
        <h2>Shared component rules</h2>
        <p>
          Use Button and ButtonLink from the shared UI folder for new surfaces.
          Primary identifies the main task; secondary supports it; quiet is
          navigation or a low-emphasis action; danger identifies a destructive
          action. Keep visible labels and keyboard focus, and separate disabled
          from busy states.
        </p>
        <p>
          Controls use a 44 px minimum target, 6 px default corners,
          Roboto/Verdana, semantic colours and consistent spacing. Page-specific
          accepted exceptions require an explicit reference. The older global
          button rule and scoped module button families are still present; they
          have not been silently restyled.
        </p>
        <Link
          className="ppo-button"
          href="/development/page-register?view=systems&entry=system%3Atheme"
        >
          Read desktop/mobile theme specification
        </Link>
      </section>
      <section className="studio-section">
        <h2>Current root tokens</h2>
        <p>
          Values below are read from the application stylesheet. Reload this
          page after a working-source edit.
        </p>
        <div className="studio-token-grid">
          {tokens.map((token) => (
            <div className="studio-token" key={token.name}>
              {/^#[0-9a-f]{3,8}$/i.test(token.value) && (
                <span
                  aria-hidden="true"
                  style={{ background: `var(${token.name})` }}
                />
              )}
              <div>
                <code>{token.name}</code>
                <p>{token.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="studio-section">
        <h2>Potential impact of a global token change</h2>
        <p>
          {consumers.length} registered source pages share the application
          styles. Some components override tokens; their own accepted references
          still govern migration and visual review.
        </p>
        <details>
          <summary>Show affected page register</summary>
          <div className="studio-impact">
            {consumers.map((entry) => (
              <Link
                key={entry.key}
                href={
                  "/development/page-register?entry=" +
                  encodeURIComponent(entry.key)
                }
              >
                {entry.title}
                <small>{entry.path}</small>
              </Link>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
