# AI1 simulated assistant implementation decision

**Document:** PPO-AI1-DEC · **Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **State:** Authorised bounded implementation; runtime evidence in handover/PR.

Dean's explicit next-step instruction authorises the first synthetic customer CRM journey using a clearly labelled simulation. This advances D-027 for the private prototype and applies the [existing design decision](ppo-assistant-direction.md) without choosing or funding a real provider.

Use a deterministic local parser behind narrow authenticated routes, source-linked scoped reads, and an actor/workspace-owned immutable proposal. The UI alone supplies explicit confirmation of the exact persisted hash/version. Reuse the existing `createOpportunity` command for every accepted save and its authoritative permission-checked receipt dispatcher for recovery. Extract its existing preflight validation into a shared function so preparation cannot invent a weaker permission or relationship policy. No direct assistant SQL business write or generic model SQL endpoint is introduced.

Alternatives considered: a paid provider now would introduce an unselected account/budget and make workflow evidence dependent on inference; a chat-only mock would not establish real persistence or safe recovery; a second opportunity implementation would drift from CRM permissions and atomicity. The selected design proves the real business journey and leaves model evaluation as a distinct next step.

Migration 0016 contains only assistant proposals; 0015 remains reserved to #64. Preserve both on integration and verify migration ordering before normal publication. An hourly local retention worker clears expired unsent copies and accepted command copies while preserving unresolved originals. Full-page responsive UI ships first; the contextual drawer is deferred and explicitly recorded. Summary pagination is stable ID order with bounded coverage, not a claim of latest or exhaustive history.

The [AI1 handover](../delivery/assistant-ai1-handover.md) records setup, functional boundaries, acceptance contributions, exact verification/publication ownership and the provider-evaluation condition. User authority does not imply owner acceptance, production readiness, live data access, voice recording or customer communications. All existing master parent IDs and P01–P12 packages are preserved.
