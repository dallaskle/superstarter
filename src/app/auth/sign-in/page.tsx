"use client"

import * as errors from "@superbuilders/errors"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useState } from "react"
import { useSignIn, useSignInWithProvider } from "@/lib/firebase/auth/hooks"

export default function SignInPage() {
	const router = useRouter()
	const { signIn, loading, error } = useSignIn()
	const { signInWithProvider, loading: providerLoading, error: providerError } = useSignInWithProvider()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [displayError, setDisplayError] = useState<string | undefined>(error)

	// Generate unique IDs for form elements
	const emailId = React.useId()
	const passwordId = React.useId()

	// Update display error when error changes
	React.useEffect(() => {
		setDisplayError(error || providerError)
	}, [error, providerError])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		const result = await errors.try(signIn(email, password))
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

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
			<div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-sm">
				<h1 className="mb-6 text-center font-bold text-3xl text-white">Sign In</h1>

				{displayError && <div className="mb-4 rounded bg-red-500/20 p-3 text-center text-red-100">{displayError}</div>}

				<form onSubmit={handleSubmit} className="space-y-4">
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
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full rounded bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
					>
						{loading ? "Signing in..." : "Sign In"}
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
						Sign in with Google
					</button>

					<button
						onClick={() => handleProviderSignIn("github")}
						disabled={isLoading}
						className="w-full rounded bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
						type="button"
					>
						Sign in with GitHub
					</button>
				</div>

				<div className="mt-6 text-center">
					<Link href="/auth/sign-up" className="text-white/60 hover:text-white">
						Don't have an account? Sign up
					</Link>
				</div>
			</div>
		</main>
	)
}
