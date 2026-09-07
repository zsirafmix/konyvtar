const { execSync } = require("child_process");

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("user:password")) {
  console.log("🚀 [Startup] DATABASE_URL észlelve, PostgreSQL séma ellenőrzése és szinkronizálása...");
  try {
    execSync("npx prisma db push --accept-data-loss --schema=../../packages/database/prisma/schema.prisma", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("✅ [Startup] PostgreSQL séma készen áll.");
  } catch (err) {
    console.warn("⚠️ [Startup] Automatikus séma-push figyelmeztetés:", err.message);
  }
}
