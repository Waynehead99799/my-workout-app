import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const nextAuth = NextAuth as unknown as (config: Record<string, unknown>) => {
  handlers: { GET: (req: Request) => Promise<Response>; POST: (req: Request) => Promise<Response> };
  auth: () => Promise<{ user?: { id?: string; name?: string; email?: string } } | null>;
  signIn: (...args: unknown[]) => Promise<unknown>;
  signOut: (...args: unknown[]) => Promise<unknown>;
};

export const { handlers, auth, signIn, signOut } = nextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = CredentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error("[auth] Invalid credentials format");
            return null;
          }
          await connectDb();
          const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
          if (!user) {
            console.error("[auth] No user found for:", parsed.data.email);
            return null;
          }
          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) {
            console.error("[auth] Invalid password for:", parsed.data.email);
            return null;
          }
          return { id: user._id.toString(), name: user.name, email: user.email };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }: { token: { id?: string }; user?: { id?: string } | null }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({
      session,
      token,
    }: {
      session: { user?: { id?: string } };
      token: { id?: string };
    }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
