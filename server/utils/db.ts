import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";

const connectionString =
	process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"Missing DATABASE_URL or DATABASE_DIRECT_URL in environment.",
	);
}

const prismaClientSingleton = () => {
	const pool = new PrismaPg({ connectionString, max: 1 });
	return new PrismaClient({ adapter: pool });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
