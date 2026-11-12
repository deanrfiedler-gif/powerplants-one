import { enumerateRoutes, type Route } from "../../scripts/warm-routes";

// The three invited-actor journeys in tests/demo/ui.spec.ts: planner/booking,
// Work Order/appointment, and mailbox/deal/calendar. Include their command
// handlers too: an unauthenticated GET compiles a POST-only route without effects.
const families = [
  "/schedule",
  "/service/appointments",
  "/service/work-orders",
  "/sales/opportunities",
  "/email",
  "/calendar",
  "/api/v1/schedule",
  "/api/v1/appointments",
  "/api/v1/service/work-orders",
  "/api/v1/crm/opportunities",
  "/api/v1/email",
  "/api/v1/calendar",
  "/api/v1/activities",
  "/api/v1/local-session",
];

export function demoWarmRoutes(routes: Route[] = enumerateRoutes()): Route[] {
  return routes.filter(
    (route) =>
      route.path === "/" ||
      families.some(
        (family) =>
          route.path === family || route.path.startsWith(`${family}/`),
      ),
  );
}
