"use client"

import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth/context"
import { useSignOut } from "@/lib/firebase/auth/hooks"

export default function HomePage() {
	const { user, loading } = useAuth()
	const { logout, loading: logoutLoading } = useSignOut()

	if (loading) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="text-xl">Loading...</div>
			</main>
		)
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<h1 className="font-extrabold text-5xl text-white tracking-tight sm:text-[5rem]">
					Firebase <span className="text-[hsl(280,100%,70%)]">T3</span> App
				</h1>

				{user ? (
					<div className="flex flex-col items-center gap-6">
						<p className="text-xl">Welcome, {user.displayName || user.email}!</p>
						<div className="flex gap-4">
							<Link
								href="/profile"
								className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
							>
								Profile
							</Link>
							<Link
								href="/posts"
								className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
							>
								Posts
							</Link>
							<button
								onClick={() => logout()}
								disabled={logoutLoading}
								className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20 disabled:opacity-50"
								type="button"
							>
								{logoutLoading ? "Signing out..." : "Sign Out"}
							</button>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center gap-6">
						<p className="text-xl">Get started by signing in</p>
						<div className="flex gap-4">
							<Link
								href="/auth/sign-in"
								className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
							>
								Sign In
							</Link>
							<Link
								href="/auth/sign-up"
								className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
							>
								Sign Up
							</Link>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
					<div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
						<h3 className="font-bold text-2xl">Firebase Auth →</h3>
						<div className="text-lg">
							Secure authentication with email/password and OAuth providers like Google and GitHub.
						</div>
					</div>
					<div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
						<h3 className="font-bold text-2xl">Firestore Database →</h3>
						<div className="text-lg">Real-time NoSQL database with offline support and automatic scaling.</div>
					</div>
				</div>
			</div>
		</main>
	)
}
