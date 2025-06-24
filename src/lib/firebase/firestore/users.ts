import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc, type Timestamp, updateDoc } from "firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"
import { db } from "@/lib/firebase/client"

export const ErrUserNotFound = errors.new("user not found")
export const ErrUserProfileCreation = errors.new("user profile creation")
export const ErrUserProfileUpdate = errors.new("user profile update")

// User profile interface
export interface UserProfile {
	uid: string
	email: string
	displayName: string
	photoURL: string
	emailVerified: boolean
	bio: string
	createdAt: Timestamp | Date
	updatedAt: Timestamp | Date
	metadata: {
		lastLoginAt: Timestamp | Date
		signUpMethod: string
	}
}

// Create or update user profile
export async function createUserProfile(user: FirebaseUser): Promise<UserProfile> {
	const userRef = doc(db, "users", user.uid)

	// Check if user already exists
	const docResult = await errors.try(getDoc(userRef))
	if (docResult.error) {
		throw errors.wrap(docResult.error, "get user profile")
	}

	const now = new Date()

	if (docResult.data.exists()) {
		// Update existing user
		const updateData = {
			email: user.email || "",
			displayName: user.displayName || "",
			photoURL: user.photoURL || "",
			emailVerified: user.emailVerified,
			updatedAt: serverTimestamp(),
			"metadata.lastLoginAt": serverTimestamp()
		}

		const updateResult = await errors.try(updateDoc(userRef, updateData))
		if (updateResult.error) {
			throw errors.wrap(updateResult.error, "update user profile")
		}

		logger.info("user profile updated", { uid: user.uid })

		// Return the updated profile with current timestamp
		const existingData = docResult.data.data()
		if (!existingData) {
			throw errors.new("user data corruption")
		}

		// Validate the data has required fields
		if (typeof existingData.uid !== "string") {
			throw errors.new("invalid user data structure")
		}

		const validatedProfile: UserProfile = {
			uid: existingData.uid,
			email: user.email || "",
			displayName: user.displayName || "",
			photoURL: user.photoURL || "",
			emailVerified: user.emailVerified,
			bio: existingData.bio || "",
			createdAt: existingData.createdAt,
			updatedAt: now,
			metadata: {
				lastLoginAt: now,
				signUpMethod: existingData.metadata?.signUpMethod || ""
			}
		}

		return validatedProfile
	}
	// Create new user
	const signUpMethod = user.providerData[0]?.providerId || "email"
	const newUser = {
		uid: user.uid,
		email: user.email || "",
		displayName: user.displayName || "",
		photoURL: user.photoURL || "",
		emailVerified: user.emailVerified,
		bio: "",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		metadata: {
			lastLoginAt: serverTimestamp(),
			signUpMethod
		}
	}

	const setResult = await errors.try(setDoc(userRef, newUser))
	if (setResult.error) {
		throw errors.wrap(setResult.error, "create user profile")
	}

	logger.info("user profile created", { uid: user.uid, signUpMethod })

	// Return the user profile with Date objects
	return {
		...newUser,
		createdAt: now,
		updatedAt: now,
		metadata: {
			lastLoginAt: now,
			signUpMethod
		}
	}
}

// Get user profile
export async function getUserProfile(uid: string): Promise<UserProfile> {
	const userRef = doc(db, "users", uid)

	const result = await errors.try(getDoc(userRef))
	if (result.error) {
		throw errors.wrap(result.error, "get user profile")
	}

	if (!result.data.exists()) {
		throw errors.wrap(ErrUserNotFound, `uid: ${uid}`)
	}

	const data = result.data.data()
	if (!data) {
		throw errors.wrap(ErrUserNotFound, `user with uid '${uid}' has no data`)
	}

	// Validate the data has required fields
	if (typeof data.uid !== "string") {
		throw errors.new("invalid user data structure")
	}

	const userProfile: UserProfile = {
		uid: data.uid,
		email: data.email || "",
		displayName: data.displayName || "",
		photoURL: data.photoURL || "",
		emailVerified: data.emailVerified ?? false,
		bio: data.bio || "",
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		metadata: {
			lastLoginAt: data.metadata?.lastLoginAt || data.createdAt,
			signUpMethod: data.metadata?.signUpMethod || ""
		}
	}

	return userProfile
}

// Update user profile
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
	const userRef = doc(db, "users", uid)

	const updateData = {
		...updates,
		updatedAt: serverTimestamp()
	}

	const result = await errors.try(updateDoc(userRef, updateData))
	if (result.error) {
		throw errors.wrap(result.error, "update user profile")
	}

	logger.info("user profile updated", { uid, updates: Object.keys(updates) })
}

// Server-side functions for admin operations
export async function getUserProfileAdmin(uid: string): Promise<UserProfile> {
	const userRef = adminDb.collection("users").doc(uid)

	const result = await errors.try(userRef.get())
	if (result.error) {
		throw errors.wrap(result.error, "admin get user profile")
	}

	if (!result.data.exists) {
		throw errors.wrap(ErrUserNotFound, `uid: ${uid}`)
	}

	const data = result.data.data()
	if (!data) {
		throw errors.wrap(ErrUserNotFound, `user with uid '${uid}' has no data`)
	}

	// Validate the data has required fields
	if (typeof data.uid !== "string") {
		throw errors.new("invalid user data structure")
	}

	const userProfile: UserProfile = {
		uid: data.uid,
		email: data.email || "",
		displayName: data.displayName || "",
		photoURL: data.photoURL || "",
		emailVerified: data.emailVerified ?? false,
		bio: data.bio || "",
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		metadata: {
			lastLoginAt: data.metadata?.lastLoginAt || data.createdAt,
			signUpMethod: data.metadata?.signUpMethod || ""
		}
	}

	return userProfile
}
