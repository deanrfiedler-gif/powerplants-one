## gantt

B1 adds an optional `after` slot to ProjectsGantt so the project page can show its Field work card inside the fixed schedule layout. The slot is additive: other consumers pass nothing and render as before. Page guidance is in the [`/projects/[id]` design register](../pages/route-projects-id.md#field-work-section-b1--30-october-2026); verification is in [the B1 evidence note](../../../testing/evidence/work-order-project-link/README.md). This is an agent decision under Dean's standing order, not Dean's acceptance.

## buttons

The Field work card uses the shared Button for every action. Because the Gantt page resets `button` styles under `#ppo-gantt-page`, `src/app/projects-gantt.css` restores the shared variants for buttons inside `.project-field-work` only. Evidence: [B1 evidence note](../../../testing/evidence/work-order-project-link/README.md).
