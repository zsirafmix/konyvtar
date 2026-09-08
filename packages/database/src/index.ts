import { PrismaClient } from "@prisma/client";

export const isDatabaseConfigured = Boolean(
  process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("dummy_placeholder") &&
    !process.env.DATABASE_URL.includes("user:password") &&
    !(
      (process.env.RENDER === "true" || process.env.NODE_ENV === "production") &&
      process.env.DATABASE_URL.includes("localhost") &&
      !process.env.FORCE_LOCAL_DB
    )
);

// Fallback placeholder so PrismaClient schema validation never throws on missing env var
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy_placeholder";
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export * from "@prisma/client";
export default prisma;
