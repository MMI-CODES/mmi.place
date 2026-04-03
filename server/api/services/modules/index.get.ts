import { prisma as client } from "~~/server/utils/db";

export default defineEventHandler(async () => {
	const prisma = client();

	const modules = await prisma.module.findMany();

	return modules;
});
