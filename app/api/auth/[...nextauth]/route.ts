import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

console.log("authOptions");

export { handler as GET, handler as POST };
