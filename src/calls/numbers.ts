import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max";
import { invalid, label } from "../shared/validation";

// Vocabulary fixed by the accepted calling paper (PPO-CALLS-CALLER-ID-PROP, Q1, Q6 and section 5.3).
export const numberLabels = ["Mobile", "Work", "Home", "Other"] as const;
export const callResults = ["Connected", "NoAnswer", "LeftVoicemail", "Busy", "WrongNumber"] as const;
export const skipReasons = ["Personal", "NotBusiness", "AlreadyLogged"] as const;
export const callSources = ["ClickToCall", "PhoneApp", "Teams"] as const;
export const callDirections = ["Outgoing", "Incoming"] as const;
export const partyTypes = ["Person", "Organisation"] as const;
export type PartyType = (typeof partyTypes)[number];

export type ReadNumber = { entered: string; e164: string | null; region: string };

export function phoneRegion(value: unknown, field = "region"): string {
  if (typeof value !== "string" || !/^[A-Z]{2}$/.test(value))
    invalid(field, "Use a two-letter country code such as AU.");
  return value;
}

// R6: the entered text is kept exactly (surrounding spaces aside). E.164 is recorded only when the
// library judges the number valid for its region; anything else needs checking and is never guessed.
export function readPhoneNumber(entered: unknown, region: unknown): ReadNumber {
  const text = label(entered, "entered", 200);
  const country = phoneRegion(region);
  const parsed = parsePhoneNumberFromString(text, country as CountryCode);
  return { entered: text, e164: parsed?.isValid() ? parsed.number : null, region: country };
}
