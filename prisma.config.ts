import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx ./prisma/seed.ts",
	},
	datasource: {
		// process.env instead of env() so prisma generate doesn't crash
		// when DATABASE_URL is not set (e.g. during Docker build)
		url: process.env.DATABASE_URL ?? "",
	},
});

