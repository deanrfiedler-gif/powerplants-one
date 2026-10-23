import type { CallMeasurement } from "./model";

// Re-project at persistence as well as in the adapter. Runtime values need not obey TS types.
export function safeMeasurement(value: unknown): CallMeasurement | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as CallMeasurement;
  if (![v.request_bytes, v.estimated_input_tokens, v.duration_ms].every(n => Number.isSafeInteger(n) && n >= 0)
    || !["global", "Missing", "Unsupported"].includes(v.inference_geo)
    || !["standard", "Missing", "Unsupported"].includes(v.speed)
    || !["standard", "Missing", "Unsupported"].includes(v.service_tier)
    || (v.thinking_tokens !== null && (!Number.isSafeInteger(v.thinking_tokens) || v.thinking_tokens < 0))
    || typeof v.unsupported_usage !== "boolean") return undefined;
  return { request_bytes: v.request_bytes, estimated_input_tokens: v.estimated_input_tokens, duration_ms: v.duration_ms,
    inference_geo: v.inference_geo, speed: v.speed, service_tier: v.service_tier,
    thinking_tokens: v.thinking_tokens, unsupported_usage: v.unsupported_usage };
}
