import { getOidcSession } from "~~/server/utils/oidc-session";
import { prisma as client } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
	const session = getOidcSession(event);
	
	if (!session) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	const prisma = client();
	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { settings: true }
	});

	if (!user) {
		throw createError({
			statusCode: 404,
			statusMessage: "User not found",
		});
	}

	return { settings: user.settings };
});
