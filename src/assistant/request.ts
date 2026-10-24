import { envelopeLimits, type AdapterRequest, type EvidenceEnvelope, type Usage } from "./model";

function requestFor(envelope: EvidenceEnvelope, allowance: Usage): AdapterRequest {
  // Explicit copies enforce the boundary at runtime; a structural TypeScript type alone would not.
  return {
    question: { text: envelope.question.text, untrusted: true },
    envelope: {
      anchor_type: envelope.anchor_type,
      messages: envelope.messages.map(m => ({ text: m.text, untrusted: true })),
      coverage: structuredClone(envelope.coverage), left_out: envelope.left_out,
      items: envelope.items.map(s => ({
        source_id: s.source_id, fields: structuredClone(s.fields), untrusted_fields: [...s.untrusted_fields],
      })),
    },
    allowance: { ...allowance },
  };
}

// Fit history to the same meter used at dispatch; keep the question and newest message intact.
// Access-checked source items/readers stay unchanged. Omissions are persisted with the answer.
export function prepareRequest(envelope: EvidenceEnvelope, allowance: Usage, inputTokens?: (request: AdapterRequest) => number) {
  let request = requestFor(envelope, allowance);
  while (inputTokens && inputTokens(request) > allowance.input_tokens && envelope.messages.length > 1) {
    const messages = envelope.messages.slice(1);
    envelope = { ...envelope, messages, left_out: envelope.left_out + 1, history_left_out: (envelope.history_left_out ?? 0) + 1, coverage: {
      ...envelope.coverage, messages: { returned: messages.length,
        limit: envelope.coverage.messages?.limit ?? envelopeLimits.messages, more: true },
    } };
    request = requestFor(envelope, allowance);
  }
  return { envelope, request };
}
