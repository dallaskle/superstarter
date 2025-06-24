"use client"

import * as errors from "@superbuilders/errors"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useState } from "react"
import { useSignInWithProvider, useSignUp } from "@/lib/firebase/auth/hooks"

export default function SignUpPage() {
	const router = useRouter()
	const { signUp, loading, error } = useSignUp()
	const { signInWithProvider, loading: providerLoading, error: providerError } = useSignInWithProvider()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [displayName, setDisplayName] = useState("")

	// Generate unique IDs for form elements
	const displayNameId = React.useId()
	const emailId = React.useId()
	const passwordId = React.useId()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const result = await errors.try(signUp(email, password, displayName))
		if (!result.error) {
			router.push("/")
		}
	}

	const handleProviderSignIn = async (provider: "google" | "github") => {
		const result = await errors.try(signInWithProvider(provider))
		if (!result.error) {
			router.push("/")
		}
	}

	const isLoading = loading || providerLoading
	const displayError = error || providerError

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
			<div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm">
				<h1 className="mb-6 text-center font-bold text-3xl text-white">Sign Up</h1>

				{displayError && <div className="mb-4 rounded bg-red-500/20 p-3 text-center text-red-100">{displayError}</div>}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor={displayNameId} className="mb-2 block text-sm text-white">
							Display Name
						</label>
						<input
							id={displayNameId}
							type="text"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder-white/50"
							disabled={isLoading}
							placeholder="John Doe"
						/>
					</div>

					<div>
						<label htmlFor={emailId} className="mb-2 block text-sm text-white">
							Email
						</label>
						<input
							id={emailId}
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder-white/50"
							required
							disabled={isLoading}
							placeholder="you@example.com"
						/>
					</div>

					<div>
						<label htmlFor={passwordId} className="mb-2 block text-sm text-white">
							Password
						</label>
						<input
							id={passwordId}
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder-white/50"
							required
							disabled={isLoading}
							placeholder="••••••••"
						/>
						<p className="mt-1 text-xs text-white/60">Password must be at least 6 characters</p>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full rounded bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
					>
						{loading ? "Creating account..." : "Sign Up"}
					</button>
				</form>

				<div className="my-6 flex items-center">
					<div className="flex-1 border-t border-white/20" />
					<span className="mx-4 text-white/60">or</span>
					<div className="flex-1 border-t border-white/20" />
				</div>

				<div className="space-y-3">
					<button
						onClick={() => handleProviderSignIn("google")}
						disabled={isLoading}
						className="w-full rounded bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
						type="button"
					>
						Continue with Google
					</button>

					<button
						onClick={() => handleProviderSignIn("github")}
						disabled={isLoading}
						className="w-full rounded bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
						type="button"
					>
						Continue with GitHub
					</button>
				</div>

				<div className="mt-6 text-center">
					<Link href="/auth/sign-in" className="text-white/60 hover:text-white">
						Already have an account? Sign in
					</Link>
				</div>
			</div>
		</main>
	)
}
