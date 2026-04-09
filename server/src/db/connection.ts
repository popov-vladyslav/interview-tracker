import { neon } from "@neondatabase/serverless";

type NeonQueryFunction = import("@neondatabase/serverless").NeonQueryFunction<false, false>;

let sql: NeonQueryFunction | undefined;

function getDb(): NeonQueryFunction {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    sql = neon(process.env.DATABASE_URL);
  }

  return sql;
}

export { getDb };
