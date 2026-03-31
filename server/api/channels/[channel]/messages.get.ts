import { prisma as client } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
	const prisma = client();
	const now = new Date();
	const messages = await prisma.message.findMany({
		where: {
			channelId: parseInt(event.context.params?.channel || "0"),
			AND: [
				{
					OR: [
						{ publishAt: null },
						{ publishAt: { lte: now } }
					]
				},
				{
					OR: [
						{ expiresAt: null },
						{ expiresAt: { gt: now } }
					]
				}
			]
		},
	});

	return messages;
});
