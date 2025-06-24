import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

// Only load environment config if not running in a Next.js environment or browser
if (!process.env.NEXT_RUNTIME && typeof window === "undefined") {
	const { loadEnvConfig } = require("@next/env")
	const projectDir = process.cwd()
	loadEnvConfig(projectDir)
}

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		FIREBASE_PROJECT_ID: z.string(),
		FIREBASE_CLIENT_EMAIL: z.string().email(),
		FIREBASE_PRIVATE_KEY: z.string(),
		NODE_ENV: z.enum(["development", "test", "production"]).default("development")
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
		NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
		NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
		NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
		NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
		NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
		NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional()
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
		FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
		FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true
})
