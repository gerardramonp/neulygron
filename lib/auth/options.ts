import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/user";
import { loginSchema } from "@/lib/validation/auth";

const authSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET must be set for authentication");
}

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Google OAuth credentials are missing. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
  );
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsed.success) {
          throw new Error("Invalid login details");
        }

        await connectToDatabase();

        const user = await UserModel.findOne({ email: parsed.data.email })
          .select("+password name email image")
          .lean();

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          name: user.name ?? undefined,
          email: user.email,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }

      if (account?.provider === "google" && token.email) {
        await connectToDatabase();

        const googleUser = await UserModel.findOneAndUpdate(
          { email: token.email },
          {
            $set: {
              name: token.name,
              image: (token as { picture?: string }).picture ?? undefined,
            },
            $setOnInsert: {
              email: token.email,
              provider: "google",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).lean();

        if (googleUser) {
          token.userId = googleUser._id.toString();
        }
      } else if (!token.userId && token.email) {
        await connectToDatabase();
        const existingUser = await UserModel.findOne({ email: token.email })
          .select("_id")
          .lean();
        if (existingUser) {
          token.userId = existingUser._id.toString();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }

      return session;
    },
  },
};
