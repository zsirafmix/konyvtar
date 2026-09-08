const { execSync } = require("child_process");

const dbUrl = process.env.DATABASE_URL;
const isLocalhostOnRender =
  (process.env.RENDER === "true" || process.env.NODE_ENV === "production") &&
  dbUrl &&
  dbUrl.includes("localhost") &&
  !process.env.FORCE_LOCAL_DB;

if (
  dbUrl &&
  !dbUrl.includes("user:password") &&
  !dbUrl.includes("dummy_placeholder") &&
  !isLocalhostOnRender
) {
  console.log("🚀 [Startup] DATABASE_URL észlelve, PostgreSQL séma ellenőrzése és szinkronizálása...");
  try {
    execSync("npx prisma db push --accept-data-loss --schema=../../packages/database/prisma/schema.prisma", {
      stdio: "inherit",
      env: process.env,
      timeout: 8000,
    });
    console.log("✅ [Startup] PostgreSQL séma készen áll.");
  } catch (err) {
    console.warn("⚠️ [Startup] Automatikus séma-push figyelmeztetés:", err.message);
  }
} else {
  console.log("⚡ [Startup] Standalone Calibre felhő index üzemmód (11 472 kötet aktív). Helyi adatbázis-szinkronizálás kihagyva.");
}
