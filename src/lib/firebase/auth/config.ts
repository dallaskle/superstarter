import { GithubAuthProvider, GoogleAuthProvider } from "firebase/auth"

// Configure authentication providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
	prompt: "select_account"
})

export const githubProvider = new GithubAuthProvider()

// Auth error codes for better error handling
export const AUTH_ERROR_CODES = {
	EMAIL_EXISTS: "auth/email-already-in-use",
	INVALID_EMAIL: "auth/invalid-email",
	USER_DISABLED: "auth/user-disabled",
	USER_NOT_FOUND: "auth/user-not-found",
	WRONG_PASSWORD: "auth/wrong-password",
	WEAK_PASSWORD: "auth/weak-password",
	NETWORK_ERROR: "auth/network-request-failed",
	TOO_MANY_REQUESTS: "auth/too-many-requests",
	POPUP_CLOSED: "auth/popup-closed-by-user",
	UNAUTHORIZED_DOMAIN: "auth/unauthorized-domain"
} as const

// Helper to get user-friendly error messages
export function getAuthErrorMessage(errorCode: string): string {
	switch (errorCode) {
		case AUTH_ERROR_CODES.EMAIL_EXISTS:
			return "This email is already registered. Please sign in instead."
		case AUTH_ERROR_CODES.INVALID_EMAIL:
			return "Please enter a valid email address."
		case AUTH_ERROR_CODES.USER_DISABLED:
			return "This account has been disabled. Please contact support."
		case AUTH_ERROR_CODES.USER_NOT_FOUND:
			return "No account found with this email. Please sign up first."
		case AUTH_ERROR_CODES.WRONG_PASSWORD:
			return "Incorrect password. Please try again."
		case AUTH_ERROR_CODES.WEAK_PASSWORD:
			return "Password should be at least 6 characters long."
		case AUTH_ERROR_CODES.NETWORK_ERROR:
			return "Network error. Please check your connection and try again."
		case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
			return "Too many failed attempts. Please try again later."
		case AUTH_ERROR_CODES.POPUP_CLOSED:
			return "Sign-in popup was closed. Please try again."
		case AUTH_ERROR_CODES.UNAUTHORIZED_DOMAIN:
			return "This domain is not authorized for authentication."
		default:
			return "An unexpected error occurred. Please try again."
	}
}
