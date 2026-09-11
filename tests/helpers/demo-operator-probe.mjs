// Test-only preload: prove CLI startup reaches the database without network access.
import pg from "pg";
pg.Pool.prototype.connect = async function () {
  console.log("SYN_OPERATOR_DATABASE_REACHED");
  throw new Error("SYN operator probe stops before any database connection");
};
