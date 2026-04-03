import { prisma as client } from "~~/server/utils/db";
export default defineEventHandler(async (event) => {
	const prisma = client();
	const session = getOidcSession(event);

	if (!session) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
		throw createError({
			statusCode: 403,
			statusMessage: "Forbidden",
		});
	}

	const { uid } = event.context.params as { uid: string };
	const { summary, module, start, end, type, teachers, location } =
		await readBody(event);

	const course = await prisma.course.upsert({
		where: {
			uid,
		},
		update: {
			summary,
			module,
			startDate: new Date(start),
			endDate: new Date(end),
			type,
			teachers,
			location,
		},
		create: {
			uid,
			summary,
			module,
			startDate: new Date(start),
			endDate: new Date(end),
			type,
			teachers,
			location,
		},
	});

	return course;
});
