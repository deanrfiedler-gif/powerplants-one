// Accepted CR-01 R4 / CR-04 D5 guidance. These are review prompts, not recorded
// completion facts or an input to permittedStageMove / Won commands.
export function dealExitGuidance(stage: string): string[] {
  return (
    (
      {
        Discovery: [
          "Review the discovery meeting evidence and agreement to explore.",
          "Confirm customer contact, site or its unknown reason, and the next activity.",
        ],
        Scoping: [
          "Review customer acceptance of feasibility and concept.",
          "Review requirements, scope, the estimating handover and next activity.",
        ],
        Quoting: [
          "Review evidence that the issued quotation reached and was acknowledged by the decision-makers.",
          "Review the exact issued revision and next activity.",
        ],
        Negotiation: [
          "Review alignment on final price, scope and terms.",
          "Review the latest issued revision and next activity.",
        ],
        Closing: [
          "Review accepted response evidence and any unresolved holds, customer contact and next activity.",
          "Record order evidence when recording Won; then prepare the explicit receiving handover.",
        ],
      } as Record<string, string[]>
    )[stage] ?? [
      "Review the saved qualification and next activity before moving this deal.",
    ]
  );
}
