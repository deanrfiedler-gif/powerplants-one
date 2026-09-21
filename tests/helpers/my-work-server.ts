import pg from "pg";
import { mock } from "node:test";
import { localConfig } from "../../src/platform/config";
import { MY_WORK_NOW, MY_WORK_CLOCK_QUERY, myWorkClockQuery } from "./my-work-clock";

// Test process only: refuse every database except the disposable test database.
// Replace the single My Work observation-clock query, then execute it through
// PostgreSQL normally. Every data query, permission check and command is real.
const config = localConfig();
if (new URL(config.database_url).pathname !== "/ppo_synthetic_test")
  throw Error("My Work browser clock requires ppo_synthetic_test.");
let fixed = false;
const query = pg.Client.prototype.query;
pg.Client.prototype.query = function (this: pg.Client, text: unknown, ...args: unknown[]) {
  // Start only when My Work is read, after Next has initialized with its normal
  // startup clock. The related Deals worklist uses JavaScript's observation time.
  // Timeout/interval timers continue running throughout the browser journey.
  if (text === MY_WORK_CLOCK_QUERY && !fixed) {
    mock.timers.enable({ apis: ["Date"], now: new Date(MY_WORK_NOW) });
    fixed = true;
  }
  return Reflect.apply(query, this, [myWorkClockQuery(text), ...args]);
} as typeof query;
