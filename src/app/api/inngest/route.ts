import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { helloWorld, notifyPostActivity, welcomeNewUser } from "@/inngest/functions/hello"

// Create an API that serves our functions
export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [helloWorld, welcomeNewUser, notifyPostActivity]
})
