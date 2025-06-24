"use client"

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { createContext, useContext, useEffect, useState } from "react"

import { auth } from "@/lib/firebase/client"

interface AuthContextValue {
	user: User | undefined
	loading: boolean
	error: Error | undefined
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
	const [user, setUser] = useState<User | undefined>(undefined)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | undefined>(undefined)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(
			auth,
			(user) => {
				setUser(user || undefined)
				setLoading(false)
				setError(undefined)

				if (user) {
					logger.info("auth state changed", { uid: user.uid, email: user.email })
				} else {
					logger.info("auth state changed", { uid: undefined })
				}
			},
			(error) => {
				const wrappedError = errors.new(`auth state change error: ${error.message}`)
				setError(wrappedError)
				setLoading(false)
				logger.error("auth state change error", { error: wrappedError })
			}
		)

		return () => unsubscribe()
	}, [])

	return <AuthContext.Provider value={{ user, loading, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw errors.new("useAuth must be used within an AuthProvider")
	}
	return context
}
