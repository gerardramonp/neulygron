This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and extended with JWT-based authentication powered by NextAuth, MongoDB, and Google OAuth.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) after the server boots.

## Environment Variables

Copy `.env` and set the following keys:

- `DB_USER` / `DB_PASSWORD`: credentials for the `mongodb+srv://` cluster (`neulygrondb.khimgi9.mongodb.net`).
- `AUTH_SECRET`: long random string used to sign JWTs (`openssl rand -base64 32`).
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`: OAuth credentials from the Google Cloud console (Web application, redirect URI `http://localhost:3000/api/auth/callback/google`).

`lib/mongodb.ts` automatically builds the connection string from the DB credentials, but you can also set `MONGODB_URI` explicitly if you prefer.

## Authentication Flow

- **Registration**: `POST /api/auth/register` validates payloads with Zod, hashes passwords with `bcryptjs`, and persists records in MongoDB.
- **Email/password login**: NextAuth Credentials provider runs against the same collection and issues stateless JWT sessions.
- **Google sign-in**: NextAuth Google provider reuses the MongoDB collection and upserts profile details so you can mix providers.
- **Client pages**: `/register` and `/login` offer basic validation, submit to the API routes, and expose a "Continue with Google" CTA.
- **Session availability**: `app/components/AuthSessionProvider.tsx` wraps the tree so hooks like `useSession` and `signOut` work anywhere. Navigation updates automatically once a user signs in.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth Documentation](https://next-auth.js.org/getting-started/introduction)
- [MongoDB Atlas](https://www.mongodb.com/atlas/database)

## Light/Dark Theme

Tailwind dark mode is enabled via a simple `theme` cookie and the `dark` class on the `<html>` element.

- Toggle globally using the floating ThemeToggle.
- Choices: `Light`, `Dark`, or `System`.
- Stored in `theme` cookie; SSR sets the `<html class="dark">` when `Dark` is chosen.
- Tailwind `dark:` variants and CSS variables in `app/globals.css` handle styles.

To style components:

- Use Tailwind variants like `bg-white dark:bg-black`.
- Or bind to CSS variables defined in `app/globals.css`.
