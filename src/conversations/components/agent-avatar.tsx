import { FontAwesomeGlyph } from "../../components/font-awesome";

// ADR-0050/0053: use the owner's private Kit mapping; never copy licensed Figma SVG bytes into Git.
// Offline and icon-free evidence use an explicit AI mark, never a person's initials.
export function AgentAvatar() {
  return (
    <span className="cv-avatar cv-agent-avatar" aria-hidden="true">
      <FontAwesomeGlyph
        icon="sparkles"
        className="cv-agent-icon"
        fallback={<span className="cv-agent-icon">AI</span>}
      />
    </span>
  );
}
