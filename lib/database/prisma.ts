import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances in Next.js development hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getAugmentedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Ensure Supabase connection pooler has appropriate timeout and connection limits
  if (url.includes("pooler.supabase.com") && !url.includes("connect_timeout")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connection_limit=10&connect_timeout=20&pool_timeout=20`;
  }
  return url;
}

const dbUrl = getAugmentedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Resilient DB query execution helper to guard against transient network/pooler drops (P1001, P1017, ECONNRESET)
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 300
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isConnectionError =
        err?.code === "P1001" || // Can't reach database server
        err?.code === "P1017" || // Server has closed connection
        err?.code === "P1008" || // Operations timed out
        err?.message?.includes("Can't reach database server") ||
        err?.message?.includes("connection closed") ||
        err?.message?.includes("Connection terminated") ||
        err?.message?.includes("ECONNRESET");

      if (isConnectionError && attempt <= maxRetries) {
        console.warn(
          `[Prisma withDbRetry] Transient connection issue (${err?.code || err?.message}). Retrying attempt ${attempt}/${maxRetries} in ${baseDelayMs * attempt}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
        continue;
      }
      throw err;
    }
  }
}

