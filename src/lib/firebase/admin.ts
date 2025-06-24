import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

import { env } from "@/env"

// Initialize Firebase Admin SDK
const apps = getApps()

if (!apps.length) {
	const initResult = errors.trySync(() => {
		return initializeApp({
			credential: cert({
				projectId: env.FIREBASE_PROJECT_ID,
				clientEmail: env.FIREBASE_CLIENT_EMAIL,
				privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
			})
		})
	})

	if (initResult.error) {
		logger.error("firebase admin initialization", { error: initResult.error })
		throw errors.wrap(initResult.error, "firebase admin initialization")
	}

	logger.info("firebase admin initialized", { projectId: env.FIREBASE_PROJECT_ID })
}

// Export admin services
export const adminAuth = getAuth()
export const adminDb = getFirestore()

// Configure Firestore settings
adminDb.settings({
	ignoreUndefinedProperties: true
})
