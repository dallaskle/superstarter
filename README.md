# Opinionated Next.js Starter with Firebase & Biome & GritQL

[![Built with Biome](https://img.shields.io/badge/formatter-Biome-blueviolet?style=flat-square&logo=biome)](https://biomejs.dev)
[![Linted with GritQL](https://img.shields.io/badge/linter-GritQL-orange?style=flat-square)](https://www.grit.io/docs)

A comprehensive, highly-opinionated starter template for building robust and scalable full-stack applications. This template integrates Next.js with Firebase (Auth & Firestore), Inngest, and a powerful, custom-enforced set of coding standards called the Superbuilder Ruleset, powered by Biome and GritQL.

The philosophy of this starter is simple: **prevent entire classes of bugs at the source**. By enforcing strict patterns for error handling, data consistency, and type safety, we aim to build applications that are not only fast and modern but also exceptionally maintainable and reliable.

## Core Technologies

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL)
*   **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
*   **Background Jobs**: [Inngest](https://www.inngest.com/)
*   **Linting & Formatting**: [Biome](https://biomejs.dev/)
*   **Custom Static Analysis**: [GritQL](https://www.grit.io/)
*   **Environment Variables**: [T3 Env](https://env.t3.gg/)
*   **Error Handling**: A custom, robust error handling library (`@superbuilders/errors`)
*   **Logging**: A structured logging library (`@superbuilders/slog`)

## Getting Started

### Prerequisites

*   [Bun](https://bun.sh/) or npm/yarn
*   Node.js
*   A Firebase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/superbuilders/superstarter.git
    cd superstarter
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    # or
    npm install
    ```

3.  **Set up Firebase:**
    - Create a new Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
    - Enable Authentication and Firestore Database
    - Enable the authentication providers you want (Email/Password, Google, GitHub)
    - Create a service account key for server-side operations

4.  **Set up environment variables:**
    Copy the `.env.example` file to `.env` and fill in your Firebase configuration:
    ```bash
    cp .env.example .env
    ```
    Your `.env` file should include:
    - Firebase Admin SDK credentials (for server-side)
    - Firebase Client SDK configuration (for client-side)

5.  **Run the development server:**
    ```bash
    bun dev
    # or
    npm run dev
    ```

6.  **Run Firebase emulators (optional, for local development):**
    ```bash
    bun firebase:emulators
    # or
    npm run firebase:emulators
    ```

Your application should now be running at `http://localhost:3000`.

## Firebase Setup

### Firestore Security Rules

The project includes comprehensive security rules in `firestore.rules`. Deploy them with:

```bash
bun firebase:deploy:rules
# or
npm run firebase:deploy:rules
```

### Firestore Indexes

Composite indexes are defined in `firestore.indexes.json`. Deploy them with:

```bash
bun firebase:deploy:indexes
# or
npm run firebase:deploy:indexes
```

### Authentication

The starter includes:
- Email/Password authentication
- OAuth providers (Google and GitHub)
- Custom user profiles stored in Firestore
- Auth state management with React Context

## The Superbuilder Ruleset: Enforced Best Practices

This starter isn't just a collection of technologies; it's a prescriptive framework for writing high-quality code. The Superbuilder Ruleset is a set of development patterns enforced by Biome and our custom GritQL rules. These rules are not mere suggestions—they are compiled into the linter and will cause build errors if violated.

### Error Handling & Logging

We enforce a Go-inspired error handling pattern that favors explicit error checking over `try...catch` blocks.

<details>
<summary><strong>🚫 Ban <code>try...catch</code> and <code>new Error()</code></strong></summary>

**Rule:** Never use native `try...catch` blocks or `new Error()`. Instead, use the custom `errors.try()` wrapper and `errors.new()` / `errors.wrap()` for creating and propagating errors.

**Rationale:** This pattern makes error handling explicit and predictable. It eliminates hidden control flow from exceptions and forces developers to handle every potential failure point, creating more robust code.

**Enforced by:**
*   `gritql/no-try.grit`
*   `gritql/no-new-error.grit`

#### ✅ Correct
```typescript
import * as errors from "@superbuilders/errors";

// Wrapping a function that might fail
const result = await errors.try(somePromise());
if (result.error) {
	// Propagate the error with additional context
	throw errors.wrap(result.error, "failed to process something");
}
const data = result.data; // data is safely available here

// Creating a new error
if (!isValid) {
	throw errors.new("validation failed: input is not valid");
}
```

#### ❌ Incorrect
```typescript
try {
	const data = await somePromise();
} catch (e) {
	// Unstructured, inconsistent error handling
	throw new Error("Something went wrong");
}
```
</details>

<details>
<summary><strong>📜 Enforce Structured Logging</strong></summary>

**Rule:** All logging must use the `@superbuilders/slog` library. Log messages must be terse, with all context provided as a key-value object. Never use string interpolation or pass more than two arguments (message and context).

**Rationale:** Structured logging produces machine-readable logs that are easy to parse, query, and monitor. It enforces consistency and ensures that critical context is never lost in a simple string. For Inngest functions, always use the `logger` provided in the function arguments to ensure proper log flushing in serverless environments.

**Enforced by:** `gritql/logger-structured-args.grit`

#### ✅ Correct
```typescript
import * as logger from "@superbuilders/slog";

logger.info("user created", { userId: user.id, plan: "premium" });
logger.error("database connection failed", { error: err, attempt: 3 });
```

#### ❌ Incorrect
```typescript
// Banned: String interpolation
console.log(`User ${user.id} was created with plan ${plan}.`);

// Banned: Non-structured logging call (too many arguments)
logger.info("User created", user.id, "premium");

// Banned: First argument is not a simple string
logger.info("user created: " + user.id);
```
</details>

### Firebase & Background Jobs (Firestore & Inngest)

<details>
<summary><strong>🚫 Ban Large Data in Inngest <code>step.run()</code></strong></summary>

**Rule:** Avoid returning large objects from Inngest `step.run()` closures, especially Firestore documents or query results.

**Rationale:** The output of `step.run()` is serialized to JSON and sent over the network for memoization. Fetching and returning large payloads can cause severe performance degradation, network bloat, and potential "request entity too large" errors. Data should be fetched *before* `step.run()`, or a dedicated data-fetching function should be called via `step.invoke()`.

#### ✅ Correct
```typescript
// Fetch data BEFORE the step
const user = await getUserProfile(event.data.userId);

// Pass only essential primitives into the step if needed
const result = await step.run("process-user-action", async () => {
    return await someExternalApiCall({ externalId: user.uid });
});
```

#### ❌ Incorrect
```typescript
const userPayload = await step.run("fetch-user", async () => {
    // This entire user object would be serialized and sent over HTTP
    return await getUserProfile(event.data.userId);
});
```
</details>

### Type Safety & Data Consistency

<details>
<summary><strong>🔁 Data Consistency</strong></summary>

**Rule:** Always use `""` (empty string) instead of `null` for optional string fields in Firestore documents.

**Rationale:** JavaScript's type system conflates `null` and `undefined`, leading to subtle bugs. By standardizing on empty strings for optional string values, we create more predictable data models, simplify validation logic, and avoid null-checking complexity.

**Enforced by:** `gritql/prefer-undefined-over-null.grit`

#### ✅ Correct
```typescript
// Firestore document
const newUser: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    bio: ""  // Optional field, default to empty string
};
```

#### ❌ Incorrect
```typescript
const newUser: UserProfile = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    bio: null
};
```
</details>

## Biome Configuration Highlights

Beyond the custom GritQL rules, this template uses a strict Biome configuration to enforce modern best practices. Here are some of the key rules enabled in `biome.json`:

*   `suspicious/noConsole`: (`error`) - Bans `console.log` and its variants, pushing developers to use the structured logger.
*   `complexity/noForEach`: (`error`) - Prefers `for...of` loops over `Array.prototype.forEach` for better performance and control flow (e.g., `break`, `continue`).
*   `style/noNonNullAssertion`: (`error`) - Forbids the `!` non-null assertion operator, promoting safer type guards.
*   `style/useTemplate`: (`error`) - Enforces the use of template literals over string concatenation.
*   `performance/noImgElement`: (`error`) - Recommends using Next.js's `<Image>` component for performance optimizations instead of the standard `<img>` tag.
*   `correctness/noUnusedVariables`: (`error`) - Keeps the codebase clean by flagging unused variables, imports, and function parameters.
*   ...and many more from the `recommended` ruleset.

## File Structure

The project follows a feature-colocated structure within the Next.js `src/app` directory.

```
.
├── gritql/                  # Custom GritQL linting rules
├── public/                  # Static assets
├── rules/                   # Markdown documentation for custom rules
└── src/
    ├── app/                 # Next.js App Router
    │   ├── api/             # API routes (e.g., for Inngest)
    │   ├── auth/            # Authentication pages
    │   ├── profile/         # User profile page
    │   ├── page.tsx         # Home page component
    │   └── layout.tsx       # Root layout with AuthProvider
    ├── lib/                 # Library code
    │   └── firebase/        # Firebase configuration and utilities
    │       ├── admin.ts     # Firebase Admin SDK
    │       ├── client.ts    # Firebase Client SDK
    │       ├── auth/        # Authentication utilities
    │       └── firestore/   # Firestore utilities
    ├── inngest/             # Inngest client and functions
    │   ├── functions/       # Inngest function definitions
    │   └── client.ts        # Inngest client initialization
    ├── styles/              # Global styles
    ├── env.js               # Environment variable validation (T3 Env)
    └── biome.json           # Biome linter and formatter configuration
```

## Available Commands

| Command                    | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `bun build`               | Builds the application for production.               |
| `bun check`               | Runs Biome linter and formatter checks.              |
| `bun check:unsafe`        | Runs Biome checks with unsafe auto-fixes applied.    |
| `bun check:write`         | Runs Biome checks and applies safe auto-fixes.       |
| `bun firebase:emulators`  | Starts Firebase emulators for local development.     |
| `bun firebase:deploy`     | Deploys Firebase rules and indexes.                  |
| `bun firebase:deploy:rules` | Deploys only Firestore security rules.            |
| `bun firebase:deploy:indexes` | Deploys only Firestore indexes.                 |
| `bun dev`                 | Starts the development server with Turbo.            |
| `bun dev:inngest`         | Starts the Inngest development server.               |
| `bun preview`             | Builds and starts the production server.             |
| `bun start`               | Starts the production server.                        |
| `bun typecheck`           | Runs TypeScript type checking and Biome fixes.       |

## Contributing

This starter is designed to enforce strict coding standards. Before contributing:

1. Ensure all Biome checks pass: `bun check`
2. Run type checking: `bun typecheck`
3. Follow the established patterns for error handling, logging, and data modeling
4. Write structured, explicit code that aligns with the Superbuilder philosophy

## License

MIT

---

Built with ❤️ by the Superbuilders team. Happy coding!