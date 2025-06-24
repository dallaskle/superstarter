import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { inngest } from "@/inngest/client"
import { getUserProfileAdmin } from "@/lib/firebase/firestore/users"

export const helloWorld = inngest.createFunction(
	{ id: "hello-world" },
	{ event: "test/hello.world" },
	async ({ event, step }) => {
		await step.sleep("wait-a-moment", "1s")
		return { message: `Hello ${event.data.email}!` }
	}
)

export const welcomeNewUser = inngest.createFunction(
	{ id: "welcome-new-user" },
	{ event: "user/created" },
	async ({ event, step }) => {
		const { uid, email, signUpMethod } = event.data

		// Log user creation
		logger.info("processing new user welcome", { uid, email, signUpMethod })

		// Fetch user profile data (demonstrating Firebase admin access)
		const profileResult = await errors.try(getUserProfileAdmin(uid))
		if (profileResult.error) {
			logger.error("failed to fetch user profile", { error: profileResult.error, uid })
			throw errors.wrap(profileResult.error, "fetch user profile")
		}

		const userProfile = profileResult.data

		// Simulate sending welcome email
		const welcomeResult = await step.run("send-welcome-email", async () => {
			// In a real app, you would send an actual email here
			logger.info("sending welcome email", {
				email: userProfile.email,
				displayName: userProfile.displayName
			})

			return {
				sent: true,
				timestamp: new Date().toISOString()
			}
		})

		// Wait before sending onboarding tips
		await step.sleep("wait-before-tips", "1h")

		// Send onboarding tips
		const tipsResult = await step.run("send-onboarding-tips", async () => {
			logger.info("sending onboarding tips", { email: userProfile.email })

			return {
				sent: true,
				timestamp: new Date().toISOString()
			}
		})

		return {
			uid,
			welcomeEmailSent: welcomeResult.sent,
			onboardingTipsSent: tipsResult.sent
		}
	}
)

export const notifyPostActivity = inngest.createFunction(
	{ id: "notify-post-activity" },
	{ event: "post/created" },
	async ({ event, step }) => {
		const actionParts = event.name.split("/")
		const action = actionParts[1] || "unknown"

		// Log the activity
		const logResult = await step.run("log-post-activity", async () => {
			logger.info("post activity", {
				action,
				postId: event.data.postId,
				authorId: event.data.authorId,
				title: event.data.title
			})

			return { logged: true }
		})

		// In a real app, you might notify followers, update analytics, etc.

		return {
			action,
			postId: event.data.postId,
			logged: logResult.logged
		}
	}
)
