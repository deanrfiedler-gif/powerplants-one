import { createHash } from "node:crypto";
import { canonical } from "../platform/operations";
import { choice, invalid, object } from "../shared/validation";
import { messageClasses, type MessageClass } from "./model";

// CUS-EMAIL: the customer email template family. Plain text only (R7, until D-024 decides branding).
export const family = "CUS-EMAIL";
// The R6 allowlist S2 can resolve for every class. Migration 0109 holds the same rows in
// ppo.customer_email_bindings; later stages add class facts there and here together.
export const sharedBindings = [
  "customer.name",
  "recipient.name",
  "site.name",
  "source.reference",
] as const;
export const subjectStart = "[{{source.reference}}] ";
export const stopLine =
  "To stop these emails, reply to this email and ask us to stop.";
export const signOff = "Powerplants";
export type TemplateDefinition = {
  schema_version: 1;
  family: typeof family;
  message_class: MessageClass;
  audience: "Customer";
  subject: string;
  body: string[];
};
const placeholder = /\{\{([^{}]*)\}\}/g;
export const bindingsIn = (text: string) =>
  [...text.matchAll(placeholder)].map((m) => m[1]);
function part(value: unknown, field: string, allowlist: readonly string[]) {
  if (typeof value !== "string" || !value.length || value.length > 2000 || /[\u0000-\u0009\u000b-\u001f\u007f]/.test(value))
    invalid(field, "Enter 1–2000 characters of plain text.");
  const text = value as string;
  for (const binding of bindingsIn(text))
    if (!allowlist.includes(binding))
      invalid(field, `Only these customer-safe fields can be used: ${allowlist.join(", ")}.`);
  if (/[{}]/.test(text.replace(placeholder, "")))
    invalid(field, "Use {{field}} only for an allowed field.");
  return text;
}
export function parseDefinition(
  value: unknown,
  allowlist: readonly string[],
): TemplateDefinition {
  const d = object(value, ["schema_version", "family", "message_class", "audience", "subject", "body"]);
  if (d.schema_version !== 1) invalid("definition.schema_version", "Only schema version 1 is supported.");
  if (d.family !== family) invalid("definition.family", `The family is ${family}.`);
  if (d.audience !== "Customer") invalid("definition.audience", "Customer email templates have the Customer audience.");
  const message_class = choice(d.message_class, "definition.message_class", messageClasses);
  const subject = part(d.subject, "definition.subject", allowlist);
  if (subject.length > 300 || !subject.startsWith(subjectStart) || subject.includes("\n"))
    invalid("definition.subject", `Start the subject with ${subjectStart.trim()} and keep it to 300 characters.`);
  if (!Array.isArray(d.body) || d.body.length < 1 || d.body.length > 40)
    invalid("definition.body", "Write 1–40 paragraphs.");
  const body = (d.body as unknown[]).map((p, i) => part(p, `definition.body.${i}`, allowlist));
  return { schema_version: 1, family, message_class, audience: "Customer", subject, body };
}
export const definitionText = (d: TemplateDefinition) => canonical(d);
export const sha256 = (text: string) =>
  createHash("sha256").update(text, "utf8").digest("hex");
export type Rendered =
  | { subject: string; body: string; missing: [] }
  | { subject: null; body: null; missing: string[] };
// Values enter as single-line plain text. The renderer adds the stop instruction (R2) and the
// provisional sign-off itself, so no template can leave them out.
export function render(
  d: TemplateDefinition,
  facts: Readonly<Record<string, string | null>>,
  correction: boolean,
): Rendered {
  const missing = new Set<string>();
  const fill = (text: string) =>
    text.replace(placeholder, (_, binding: string) => {
      const value = facts[binding]?.replace(/\s+/g, " ").trim();
      if (!value) {
        missing.add(binding);
        return "";
      }
      return value.slice(0, 200);
    });
  let subject = fill(d.subject);
  const paragraphs = d.body.map(fill);
  if (missing.size) return { subject: null, body: null, missing: [...missing].sort() };
  if (correction) {
    subject = subject.replace(/^(\[[^\]]*\] )/, "$1Correction: ");
    paragraphs.unshift(
      `This message corrects our earlier message about ${facts["source.reference"]}.`,
    );
  }
  return {
    subject: subject.slice(0, 400),
    body: [...paragraphs, stopLine, signOff].join("\n\n"),
    missing: [],
  };
}
export const contentHash = (to: string | null, subject: string, body: string) =>
  sha256(canonical({ to, subject, body }));
