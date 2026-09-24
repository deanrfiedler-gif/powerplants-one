# Canonical visit job pack handover

Owner: Dean Fiedler. Catalogue key: job-pack-entry. Shared by Field Technicians and appointment detail; scope SV-05, receiving PL-02/SV-04. Reuses ReadState, Button and ButtonLink and the existing permission-filtered appointment pack endpoint.

## Desktop

Display exact pack reference/status and Open job pack. When the server returns no visible pack and can_prepare, display Prepare job pack with the exact appointment query. Otherwise explain unavailable access without claiming that no pack exists. A refresh hides earlier links immediately; denied/error reads keep them hidden. A 401/403/404 response displays a non-error access-unavailable status and refresh control, without claiming that no pack exists. A transport/server failure still displays the shared error and retry control. The optional panel never grants pack access to an appointment-only reader.

## Mobile

Wrap wording and references, keep 44 px actions within the drawer and appointment panel. Keyboard: native focusable links/buttons; the enclosing Field Technicians dialog retains its trap and return behaviour. No drag interaction or independent scroll region is added.

Fixtures: `tests/browser/job-pack-integration.spec.ts` exercises existing, prepare, unavailable, 403/404 denied, server-failed and refresh states through both real consumers. The catalogue remains Reference only because it has no isolated renderer. Command permission, visit readiness and approved scope are rechecked by the existing server on Save; this component grants no authority. Review and deployment are separate.
