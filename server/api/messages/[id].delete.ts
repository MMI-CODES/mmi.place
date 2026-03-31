import { prisma as client } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
	const session = getOidcSession(event);
	const prisma = client();

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

	const messageId = parseInt(event.context.params?.id || "0");
	if (!messageId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Invalid message ID",
		});
	}

	await prisma.message.delete({
		where: { id: messageId },
	});

	return { success: true };
});
