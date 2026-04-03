import { prisma as client } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
	const prisma = client();

	const { uid } = event.context.params as { uid: string };

	const course = await prisma.course.findUnique({
		where: {
			uid,
		},
	});

	return course;
});
