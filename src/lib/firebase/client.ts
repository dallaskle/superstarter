import * as errors from "@superbuilders/errors"
import { type FirebaseApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

import { env } from "@/env"

// Firebase client configuration
const firebaseConfig = {
	apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
	measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
function getFirebaseApp(): FirebaseApp {
	const existingApps = getApps()
	if (existingApps.length > 0) {
		const app = existingApps[0]
		if (!app) {
			throw errors.new("firebase app not found in existing apps")
		}
		return app
	}

	const initResult = errors.trySync(() => initializeApp(firebaseConfig))
	if (initResult.error) {
		throw errors.wrap(initResult.error, "firebase client initialization")
	}
	return initResult.data
}

const app = getFirebaseApp()

// Export Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Enable offline persistence for Firestore
if (typeof window !== "undefined") {
	import("firebase/firestore").then(({ enableIndexedDbPersistence }) => {
		const persistenceResult = errors.trySync(() => enableIndexedDbPersistence(db))
		if (persistenceResult.error) {
			// Ignore multiple tab errors
			if (!persistenceResult.error.message.includes("multiple tabs")) {
				throw errors.wrap(persistenceResult.error, "firestore offline persistence")
			}
		}
	})
}
