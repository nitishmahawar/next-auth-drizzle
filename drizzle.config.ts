import { Config } from "drizzle-kit";

export default {
  driver: "pg",
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
  schema: "./db/schema.ts",
  out: "./drizzle",
} satisfies Config;
