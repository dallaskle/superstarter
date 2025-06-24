"use client"

import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import Image from "next/image"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth/context"
import { getUserProfile, type UserProfile, updateUserProfile } from "@/lib/firebase/firestore/users"

export default function ProfilePage() {
	const router = useRouter()
	const { user, loading: authLoading } = useAuth()
	const [profile, setProfile] = useState<UserProfile | undefined>(undefined)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | undefined>(undefined)

	// Form state
	const [displayName, setDisplayName] = useState("")
	const [bio, setBio] = useState("")

	// Generate unique IDs for form elements
	const displayNameId = React.useId()
	const bioId = React.useId()

	const loadProfile = React.useCallback(async () => {
		if (!user) return

		const result = await errors.try(getUserProfile(user.uid))
		if (result.error) {
			logger.error("failed to load profile", { error: result.error })
			setError("Failed to load profile")
			setLoading(false)
			return
		}

		setProfile(result.data)
		setDisplayName(result.data.displayName)
		setBio(result.data.bio)
		setLoading(false)
	}, [user])

	useEffect(() => {
		if (!authLoading && !user) {
			router.push("/auth/sign-in")
			return
		}

		if (user) {
			loadProfile()
		}
	}, [user, authLoading, router, loadProfile])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!user) return

		setSaving(true)
		setError(undefined)

		const result = await errors.try(
			updateUserProfile(user.uid, {
				displayName,
				bio
			})
		)

		if (result.error) {
			logger.error("profile update failed", { error: result.error })
			setError("Failed to update profile")
		} else {
			// Reload profile to get updated data
			await loadProfile()
		}

		setSaving(false)
	}

	if (authLoading || loading) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="text-xl">Loading...</div>
			</main>
		)
	}

	if (!user || !profile) {
		return null
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
			<div className="w-full max-w-2xl rounded-lg bg-white/10 p-8 backdrop-blur-sm">
				<h1 className="mb-6 text-center font-bold text-3xl text-white">Profile</h1>

				{error && <div className="mb-4 rounded bg-red-500/20 p-3 text-center text-red-100">{error}</div>}

				<div className="mb-6 text-center">
					{user.photoURL && (
						<Image
							src={user.photoURL}
							alt={user.displayName || "Profile"}
							width={96}
							height={96}
							className="mx-auto mb-4 rounded-full"
						/>
					)}
					<p className="text-white/60">{user.email}</p>
					<p className="text-sm text-white/40">
						Member since{" "}
						{profile.createdAt
							? new Date(
									typeof profile.createdAt === "object" && "seconds" in profile.createdAt
										? profile.createdAt.seconds * 1000
										: profile.createdAt
								).toLocaleDateString()
							: "Unknown"}
					</p>
				</div>

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
							disabled={saving}
							className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder-white/50 outline-none focus:bg-white/30"
							placeholder="Your name"
						/>
					</div>

					<div>
						<label htmlFor={bioId} className="mb-2 block text-sm text-white">
							Bio
						</label>
						<textarea
							id={bioId}
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							disabled={saving}
							rows={4}
							className="w-full rounded bg-white/10 px-4 py-2 text-white placeholder-white/50 outline-none focus:bg-white/30"
							placeholder="Tell us about yourself..."
						/>
					</div>

					<div className="flex gap-4">
						<button
							type="submit"
							disabled={saving}
							className="flex-1 rounded bg-white/20 py-2 font-semibold text-white transition hover:bg-white/30 disabled:opacity-50"
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>

						<button
							type="button"
							onClick={() => router.push("/")}
							disabled={saving}
							className="flex-1 rounded bg-white/10 py-2 font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
						>
							Back to Home
						</button>
					</div>
				</form>
			</div>
		</main>
	)
}
