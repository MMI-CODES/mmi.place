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

	const { title, content, buttons, channelId, publishAt, expiresAt } = await readBody(event);

	if (!title || !content || !channelId) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing required fields",
		});
	}

	const message = await prisma.message.update({
		where: { id: messageId },
		data: {
			title,
			content,
			channel: {
				connect: { id: channelId },
			},
			buttons: buttons || [],
			publishAt: publishAt ? new Date(publishAt) : null,
			expiresAt: expiresAt ? new Date(expiresAt) : null,
		},
	});

	return message;
});
