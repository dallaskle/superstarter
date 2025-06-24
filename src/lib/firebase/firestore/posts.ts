import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	type QueryConstraint,
	query,
	serverTimestamp,
	type Timestamp,
	updateDoc,
	where
} from "firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"
import { db } from "@/lib/firebase/client"
import { postConverter } from "@/lib/firebase/firestore/converters"

export const ErrPostNotFound = errors.new("post not found")
export const ErrPostCreation = errors.new("post creation")
export const ErrPostUpdate = errors.new("post update")
export const ErrPostDeletion = errors.new("post deletion")

// Post interface
export interface Post {
	id: string
	title: string
	content: string
	authorId: string
	author: {
		uid: string
		displayName: string
		photoURL: string
	}
	createdAt: Timestamp | Date
	updatedAt: Timestamp | Date
}

// Create post input
export interface CreatePostInput {
	title: string
	content: string
	authorId: string
	author: {
		uid: string
		displayName: string
		photoURL: string
	}
}

// Update post input
export interface UpdatePostInput {
	title?: string
	content?: string
}

// Create a new post
export async function createPost(input: CreatePostInput): Promise<Post> {
	const postsRef = collection(db, "posts")

	const newPost = {
		title: input.title,
		content: input.content,
		authorId: input.authorId,
		author: input.author,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	}

	const result = await errors.try(addDoc(postsRef, newPost))
	if (result.error) {
		throw errors.wrap(result.error, "create post")
	}

	logger.info("post created", { postId: result.data.id, authorId: input.authorId })

	// Return the post with the generated ID
	return {
		id: result.data.id,
		title: input.title,
		content: input.content,
		authorId: input.authorId,
		author: input.author,
		createdAt: new Date(),
		updatedAt: new Date()
	}
}

// Get a single post by ID
export async function getPost(postId: string): Promise<Post> {
	const postRef = doc(db, "posts", postId).withConverter(postConverter)

	const result = await errors.try(getDoc(postRef))
	if (result.error) {
		throw errors.wrap(result.error, "get post")
	}

	if (!result.data.exists()) {
		throw errors.wrap(ErrPostNotFound, `id: ${postId}`)
	}

	const data = result.data.data()
	if (!data) {
		throw errors.new("post data corruption")
	}

	return data
}

// Get posts with optional filters
export async function getPosts(options?: {
	authorId?: string
	limit?: number
	orderByField?: "createdAt" | "updatedAt"
	orderDirection?: "asc" | "desc"
}): Promise<Post[]> {
	const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")]

	if (options?.authorId) {
		constraints.push(where("authorId", "==", options.authorId))
	}

	if (options?.limit) {
		constraints.push(limit(options.limit))
	}

	const q = query(collection(db, "posts").withConverter(postConverter), ...constraints)

	const result = await errors.try(getDocs(q))
	if (result.error) {
		throw errors.wrap(result.error, "get posts")
	}

	const posts: Post[] = []
	for (const doc of result.data.docs) {
		const data = doc.data()
		if (data) {
			posts.push(data)
		}
	}

	logger.info("posts retrieved", { count: posts.length })
	return posts
}

// Update a post
export async function updatePost(postId: string, updates: UpdatePostInput): Promise<void> {
	const postRef = doc(db, "posts", postId)

	// Check if post exists
	const getResult = await errors.try(getDoc(postRef))
	if (getResult.error) {
		throw errors.wrap(getResult.error, "get post for update")
	}

	if (!getResult.data.exists()) {
		throw errors.wrap(ErrPostNotFound, `postId: ${postId}`)
	}

	const updateData = {
		...updates,
		updatedAt: serverTimestamp()
	}

	const updateResult = await errors.try(updateDoc(postRef, updateData))
	if (updateResult.error) {
		throw errors.wrap(updateResult.error, "update post")
	}

	logger.info("post updated", { postId, updates: Object.keys(updates) })
}

// Delete a post
export async function deletePost(postId: string): Promise<void> {
	const postRef = doc(db, "posts", postId)

	// Check if post exists
	const getResult = await errors.try(getDoc(postRef))
	if (getResult.error) {
		throw errors.wrap(getResult.error, "get post for deletion")
	}

	if (!getResult.data.exists()) {
		throw errors.wrap(ErrPostNotFound, `postId: ${postId}`)
	}

	const deleteResult = await errors.try(deleteDoc(postRef))
	if (deleteResult.error) {
		throw errors.wrap(deleteResult.error, "delete post")
	}

	logger.info("post deleted", { postId })
}

// Server-side function to get posts
export async function getPostsAdmin(options?: { authorId?: string; limit?: number }): Promise<Post[]> {
	let q = adminDb.collection("posts").orderBy("createdAt", "desc")

	if (options?.authorId) {
		q = q.where("authorId", "==", options.authorId)
	}

	if (options?.limit) {
		q = q.limit(options.limit)
	}

	const result = await errors.try(q.get())
	if (result.error) {
		throw errors.wrap(result.error, "admin get posts")
	}

	const posts: Post[] = []
	for (const doc of result.data.docs) {
		const data = doc.data()
		if (
			data &&
			typeof data.title === "string" &&
			typeof data.content === "string" &&
			typeof data.authorId === "string" &&
			typeof data.author === "object" &&
			data.author
		) {
			posts.push({
				id: doc.id,
				title: data.title,
				content: data.content,
				authorId: data.authorId,
				author: {
					uid: data.author.uid || "",
					displayName: data.author.displayName || "",
					photoURL: data.author.photoURL || ""
				},
				createdAt: data.createdAt,
				updatedAt: data.updatedAt
			})
		}
	}

	logger.info("admin posts retrieved", { count: posts.length })
	return posts
}
