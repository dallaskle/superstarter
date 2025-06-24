import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { DecodedIdToken } from "firebase-admin/auth"
import { cookies } from "next/headers"

import { adminAuth } from "@/lib/firebase/admin"

export const ErrNoAuthToken = errors.new("no auth token")
export const ErrInvalidAuthToken = errors.new("invalid auth token")

// Verify ID token from cookie
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
	const result = await errors.try(adminAuth.verifyIdToken(idToken))
	if (result.error) {
		logger.error("id token verification failed", { error: result.error })
		throw errors.wrap(result.error, "verify id token")
	}

	return result.data
}

// Get current user from request cookies
export async function getCurrentUser(): Promise<DecodedIdToken | undefined> {
	const cookieStore = await cookies()
	const idToken = cookieStore.get("firebaseIdToken")?.value

	if (!idToken) {
		return undefined
	}

	const result = await errors.try(verifyIdToken(idToken))
	if (result.error) {
		// Token might be expired or invalid
		return undefined
	}

	return result.data
}

// Require authentication - throws if not authenticated
export async function requireAuth(): Promise<DecodedIdToken> {
	const user = await getCurrentUser()

	if (!user) {
		throw errors.wrap(ErrNoAuthToken, "authentication required")
	}

	return user
}

// Create custom token for server-side auth
export async function createCustomToken(uid: string, claims?: object): Promise<string> {
	const result = await errors.try(adminAuth.createCustomToken(uid, claims))
	if (result.error) {
		logger.error("custom token creation failed", { error: result.error, uid })
		throw errors.wrap(result.error, "create custom token")
	}

	logger.info("custom token created", { uid, hasClaims: !!claims })
	return result.data
}

// Set custom user claims
export async function setCustomUserClaims(uid: string, claims: object): Promise<void> {
	const result = await errors.try(adminAuth.setCustomUserClaims(uid, claims))
	if (result.error) {
		logger.error("set custom claims failed", { error: result.error, uid })
		throw errors.wrap(result.error, "set custom claims")
	}

	logger.info("custom claims set", { uid, claims: Object.keys(claims) })
}

// Get user by email
export async function getUserByEmail(email: string) {
	const result = await errors.try(adminAuth.getUserByEmail(email))
	if (result.error) {
		logger.error("get user by email failed", { error: result.error, email })
		throw errors.wrap(result.error, "get user by email")
	}

	return result.data
}

// Delete user
export async function deleteUser(uid: string): Promise<void> {
	const result = await errors.try(adminAuth.deleteUser(uid))
	if (result.error) {
		logger.error("delete user failed", { error: result.error, uid })
		throw errors.wrap(result.error, "delete user")
	}

	logger.info("user deleted", { uid })
}
