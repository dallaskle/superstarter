import * as logger from "@superbuilders/slog"
import { EventSchemas, type GetEvents, Inngest } from "inngest"
import { z } from "zod"

const events = {
	"test/hello.world": {
		data: z.object({
			email: z.string().email()
		})
	},
	"user/created": {
		data: z.object({
			uid: z.string(),
			email: z.string().email(),
			displayName: z.string().optional(),
			signUpMethod: z.string()
		})
	},
	"user/updated": {
		data: z.object({
			uid: z.string(),
			updates: z.record(z.any())
		})
	},
	"post/created": {
		data: z.object({
			postId: z.string(),
			authorId: z.string(),
			title: z.string()
		})
	},
	"post/updated": {
		data: z.object({
			postId: z.string(),
			authorId: z.string(),
			updates: z.record(z.any())
		})
	},
	"post/deleted": {
		data: z.object({
			postId: z.string(),
			authorId: z.string()
		})
	}
}

export const inngest = new Inngest({
	id: "my-app",
	schemas: new EventSchemas().fromZod(events),
	logger
})

export type Events = GetEvents<typeof inngest>
