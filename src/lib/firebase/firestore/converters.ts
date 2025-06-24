import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore"
import type { Post } from "./posts"
import type { UserProfile } from "./users"

// Helper to convert Firestore timestamps to Date objects
function convertTimestampsToDate(data: DocumentData): DocumentData {
	const converted: DocumentData = {}
	for (const key in data) {
		const value = data[key]
		if (
			value &&
			typeof value === "object" &&
			typeof value.seconds === "number" &&
			typeof value.nanoseconds === "number"
		) {
			// This is a Firestore Timestamp
			if (typeof value.toDate === "function") {
				converted[key] = value.toDate()
			} else {
				// Fallback for server-side timestamps that don't have toDate
				converted[key] = new Date(value.seconds * 1000)
			}
		} else if (value && typeof value === "object" && !Array.isArray(value)) {
			converted[key] = convertTimestampsToDate(value)
		} else {
			converted[key] = value
		}
	}
	return converted
}

// User profile converter
export const userProfileConverter: FirestoreDataConverter<UserProfile> = {
	toFirestore(userProfile: UserProfile): DocumentData {
		return userProfile
	},

	fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): UserProfile {
		const data = snapshot.data(options)
		const converted = convertTimestampsToDate(data)
		const userProfile: UserProfile = {
			uid: converted.uid || "",
			email: converted.email || "",
			displayName: converted.displayName || "",
			photoURL: converted.photoURL || "",
			emailVerified: converted.emailVerified || false,
			bio: converted.bio || "",
			createdAt: converted.createdAt || new Date(),
			updatedAt: converted.updatedAt || new Date(),
			metadata: converted.metadata || {
				lastLoginAt: new Date(),
				signUpMethod: "unknown"
			}
		}
		return userProfile
	}
}

// Post converter
export const postConverter: FirestoreDataConverter<Post> = {
	toFirestore(post: Post): DocumentData {
		// Remove the id field when writing to Firestore
		const { id: _, ...postData } = post
		return postData
	},

	fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Post {
		const data = snapshot.data(options)
		const converted = convertTimestampsToDate(data)
		const post: Post = {
			id: snapshot.id,
			title: converted.title || "",
			content: converted.content || "",
			authorId: converted.authorId || "",
			author: converted.author || {
				uid: "",
				displayName: "",
				photoURL: ""
			},
			createdAt: converted.createdAt || new Date(),
			updatedAt: converted.updatedAt || new Date()
		}
		return post
	}
}

// Helper function to create a typed collection reference
import { type CollectionReference, collection as firestoreCollection } from "firebase/firestore"
import { db } from "@/lib/firebase/client"

export function collection<T>(collectionName: string, converter: FirestoreDataConverter<T>): CollectionReference<T> {
	return firestoreCollection(db, collectionName).withConverter(converter)
}

// Typed collection references
export const usersCollection = collection<UserProfile>("users", userProfileConverter)
export const postsCollection = collection<Post>("posts", postConverter)
