import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema.ts", // Path to your schema file
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
