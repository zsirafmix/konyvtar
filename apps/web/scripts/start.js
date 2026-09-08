const { spawn, execSync } = require("child_process");
const path = require("path");

const port = process.env.PORT || 3000;
const host = "0.0.0.0";

console.log(`🚀 [Startup] Librarian AI indítása a(z) ${host}:${port} címen...`);

// Check if database should be initialized
const dbUrl = process.env.DATABASE_URL;
const isRender = process.env.RENDER === "true";
const isProduction = process.env.NODE_ENV === "production";
const isLocalhostDb = dbUrl && dbUrl.includes("localhost");

if (
  dbUrl &&
  !dbUrl.includes("user:password") &&
  !dbUrl.includes("dummy_placeholder") &&
  !(isRender && isLocalhostDb) &&
  !(isProduction && isLocalhostDb && !process.env.FORCE_LOCAL_DB)
) {
  try {
    console.log("📦 [Startup] Távoli PostgreSQL adatbázis séma ellenőrzése...");
    const schemaPath = path.resolve(__dirname, "../../../packages/database/prisma/schema.prisma");
    execSync(`npx prisma db push --accept-data-loss --schema=${schemaPath}`, {
      stdio: "inherit",
      env: process.env,
      timeout: 8000, // Strict 8s timeout to avoid blocking port binding
    });
    console.log("✅ [Startup] Adatbázis séma készen áll.");
  } catch (err) {
    console.warn("⚠️ [Startup] Nem sikerült a séma automatikus szinkronizálása, folytatás standalone módban:", err.message);
  }
} else {
  console.log("⚡ [Startup] Standalone Calibre felhő index üzemmód (11 472 kötet aktív). Helyi adatbázis-szinkronizálás kihagyva.");
}

// Start Next.js directly binding to 0.0.0.0 and PORT
const projectRoot = path.resolve(__dirname, "..");
const nextBin = require.resolve("next/dist/bin/next");
console.log(`🌐 [Server] Next.js indítása ${host}:${port} címen...`);
const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: host,
    },
    cwd: projectRoot,
  }
);

child.on("error", (err) => {
  console.error("❌ [Server] Hiba a Next.js indításakor:", err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (code !== 0) {
    console.error(`❌ [Server] A Next.js leállt (kód: ${code}, szignál: ${signal})`);
    process.exit(code || 1);
  }
});

// Forward termination signals
process.on("SIGTERM", () => {
  console.log("🛑 [Server] SIGTERM fogadva, leállítás...");
  child.kill("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("🛑 [Server] SIGINT fogadva, leállítás...");
  child.kill("SIGINT");
});
