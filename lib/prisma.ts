// /lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function createPrismaClient() {
  const client = new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Add connection retry logic
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      await client.$connect();
      return client;
    } catch (error) {
      retries++;
      if (retries === MAX_RETRIES) {
        console.error(
          "Failed to connect to database after multiple retries:",
          error
        );
        throw error;
      }
      console.warn(
        `Database connection attempt ${retries} failed, retrying in ${RETRY_DELAY}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Failed to connect to database");
}

let prisma: PrismaClient;

declare global {
  var prisma: PrismaClient;
}

async function initializePrisma() {
  if (process.env.NODE_ENV === "production") {
    prisma = await createPrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = await createPrismaClient();
    }
    prisma = global.prisma;
  }

  // Add error handling middleware
  prisma.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error: any) {
      console.error("Prisma operation failed:", error);
      // If it's a connection error, try to reconnect
      if (error.message?.includes("Can't reach database server")) {
        try {
          await prisma.$disconnect();
          await prisma.$connect();
          // Retry the operation
          return await next(params);
        } catch (retryError) {
          console.error("Failed to reconnect to database:", retryError);
          throw retryError;
        }
      }
      throw error;
    }
  });

  return prisma;
}

// Initialize Prisma
prisma = new PrismaClient(); // Initialize with default client first
initializePrisma().catch(console.error);

export default prisma;
