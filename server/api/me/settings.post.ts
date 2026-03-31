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

	const body = await readBody(event);
	
	if (!body || !body.settings) {
		throw createError({
			statusCode: 400,
			statusMessage: "Missing config JSON",
		});
	}

	const prisma = client();
	const user = await prisma.user.update({
		where: { email: session.user.email },
		data: { settings: body.settings }
	});

	return { success: true };
});
