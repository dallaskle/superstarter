"use client"

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { FirebaseError } from "firebase/app"
import {
	type AuthProvider,
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	updateProfile
} from "firebase/auth"
import { useCallback, useState } from "react"

import { auth } from "@/lib/firebase/client"
import { createUserProfile } from "@/lib/firebase/firestore/users"
import { getAuthErrorMessage, githubProvider, googleProvider } from "./config"

export const ErrAuthOperation = errors.new("auth operation")
export const ErrAuthUserNotFound = errors.new("auth user not found")

/**
 * Common state interface for auth operations
 */
interface AuthOperationState {
	loading: boolean
	error: string | undefined
}

function getFirebaseErrorCode(error: unknown): string {
	if (error instanceof FirebaseError) {
		return error.code
	}
	return ""
}

export function useSignUp() {
	const [state, setState] = useState<AuthOperationState>({ loading: false, error: undefined })

	const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
		setState({ loading: true, error: undefined })

		const result = await errors.try(createUserWithEmailAndPassword(auth, email, password))
		if (result.error) {
			const errorMessage = getAuthErrorMessage(getFirebaseErrorCode(result.error))
			setState({ loading: false, error: errorMessage })
			logger.error("sign up failed", { error: result.error, email })
			throw errors.wrap(ErrAuthOperation, errorMessage)
		}

		const user = result.data.user

		// Update display name if provided
		if (displayName) {
			const updateResult = await errors.try(updateProfile(user, { displayName }))
			if (updateResult.error) {
				logger.warn("display name update failed", { error: updateResult.error, uid: user.uid })
			}
		}

		// Create user profile in Firestore
		const profileResult = await errors.try(createUserProfile(user))
		if (profileResult.error) {
			logger.error("user profile creation failed", { error: profileResult.error, uid: user.uid })
		}

		setState({ loading: false, error: undefined })
		logger.info("sign up successful", { uid: user.uid, email })
		return user
	}, [])

	return { signUp, ...state }
}

export function useSignIn() {
	const [state, setState] = useState<AuthOperationState>({ loading: false, error: undefined })

	const signIn = useCallback(async (email: string, password: string) => {
		setState({ loading: true, error: undefined })

		const result = await errors.try(signInWithEmailAndPassword(auth, email, password))
		if (result.error) {
			const errorMessage = getAuthErrorMessage(getFirebaseErrorCode(result.error))
			setState({ loading: false, error: errorMessage })
			logger.error("sign in failed", { error: result.error, email })
			throw errors.wrap(ErrAuthOperation, errorMessage)
		}

		setState({ loading: false, error: undefined })
		logger.info("sign in successful", { uid: result.data.user.uid, email })
		return result.data.user
	}, [])

	return { signIn, ...state }
}

export function useSignInWithProvider() {
	const [state, setState] = useState<AuthOperationState>({ loading: false, error: undefined })

	const signInWithProvider = useCallback(async (providerName: "google" | "github") => {
		setState({ loading: true, error: undefined })

		let provider: AuthProvider
		switch (providerName) {
			case "google":
				provider = googleProvider
				break
			case "github":
				provider = githubProvider
				break
			default:
				throw errors.new(`unsupported provider: ${providerName}`)
		}

		const result = await errors.try(signInWithPopup(auth, provider))
		if (result.error) {
			const errorMessage = getAuthErrorMessage(getFirebaseErrorCode(result.error))
			setState({ loading: false, error: errorMessage })
			logger.error("provider sign in failed", { error: result.error, provider: providerName })
			throw errors.wrap(ErrAuthOperation, errorMessage)
		}

		const user = result.data.user

		// Create/update user profile in Firestore
		const profileResult = await errors.try(createUserProfile(user))
		if (profileResult.error) {
			logger.error("user profile creation failed", { error: profileResult.error, uid: user.uid })
		}

		setState({ loading: false, error: undefined })
		logger.info("provider sign in successful", { uid: user.uid, provider: providerName })
		return user
	}, [])

	return { signInWithProvider, ...state }
}

export function useSignOut() {
	const [state, setState] = useState<AuthOperationState>({ loading: false, error: undefined })

	const logout = useCallback(async () => {
		setState({ loading: true, error: undefined })

		const result = await errors.try(signOut(auth))
		if (result.error) {
			const errorMessage = "Failed to sign out. Please try again."
			setState({ loading: false, error: errorMessage })
			logger.error("sign out failed", { error: result.error })
			throw errors.wrap(ErrAuthOperation, errorMessage)
		}

		setState({ loading: false, error: undefined })
		logger.info("sign out successful")
	}, [])

	return { logout, ...state }
}

export function usePasswordReset() {
	const [state, setState] = useState<AuthOperationState>({ loading: false, error: undefined })

	const resetPassword = useCallback(async (email: string) => {
		setState({ loading: true, error: undefined })

		const result = await errors.try(sendPasswordResetEmail(auth, email))
		if (result.error) {
			const errorMessage = getAuthErrorMessage(getFirebaseErrorCode(result.error))
			setState({ loading: false, error: errorMessage })
			logger.error("password reset failed", { error: result.error, email })
			throw errors.wrap(ErrAuthOperation, errorMessage)
		}

		setState({ loading: false, error: undefined })
		logger.info("password reset email sent", { email })
	}, [])

	return { resetPassword, ...state }
}
