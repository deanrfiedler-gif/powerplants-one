// Local weather for the My Work phone overview (mobile r07). This is the contract the card reads
// and the one place a provider would plug in. Powerplants One has no weather provider, no
// geocoder and no saved workspace location today, so the read says exactly that: it returns
// "not_configured" and never a sample. Illustrative values (Brisbane, 23°) exist only in test
// fixtures that stub this route. Adding a provider is an architecture decision of its own
// (credentials, cost, attribution, caching), not something this read may quietly acquire.
import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { invalid, object } from "../shared/validation";

export const weatherConditions = ["Clear", "PartlyCloudy", "Cloudy", "Rain", "Storm", "Fog", "Wind"] as const;
export type WeatherCondition = (typeof weatherConditions)[number];
export type WeatherPeriod = {
  // The local period this forecast is valid for, as instants.
  valid_from: string;
  valid_to: string;
  label: string;
  condition: WeatherCondition;
  summary: string;
  high_c: number | null;
  low_c: number | null;
  // Probability of any rain, in percent. Never a rainfall amount.
  rain_chance_pct: number | null;
  // Expected rainfall in millimetres, where the provider gives one. Shown separately.
  rain_mm: number | null;
};
export type WeatherReport =
  | { status: "not_configured"; observed_at: string }
  // A provider exists but could not answer. The chosen place is kept so a retry asks the same question.
  | { status: "unavailable"; observed_at: string; location: string | null; retryable: boolean }
  | {
      status: "ok";
      observed_at: string;
      location: string;
      // Places the reader may choose from, where the provider or workspace supplies them.
      locations: string[];
      condition: WeatherCondition;
      summary: string;
      temperature_c: number;
      today: WeatherPeriod;
      forecast: WeatherPeriod[];
      // When the provider produced these values, and whether they are older than it considers current.
      issued_at: string;
      stale: boolean;
      provider: { name: string; attribution: string | null; url: string | null };
    };

export async function readWorkWeather(p: Principal, input: unknown = {}): Promise<WeatherReport> {
  await requireCapability(database(), p, "activity.read");
  const r = object(input, ["location", "latitude", "longitude"]);
  if (r.location !== undefined && (typeof r.location !== "string" || r.location.length > 80))
    invalid("location", "Use a place name of up to 80 characters.");
  for (const [key, limit] of [["latitude", 90], ["longitude", 180]] as const)
    if (r[key] !== undefined && !(Math.abs(Number(r[key])) <= limit)) invalid(key, "Give decimal degrees.");
  // No provider adapter is registered. Nothing is fetched and the supplied place is not stored.
  return { status: "not_configured", observed_at: new Date().toISOString() };
}
