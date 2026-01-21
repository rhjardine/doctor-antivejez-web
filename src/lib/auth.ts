import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // --- DEBUGGING LOGS START ---
        console.log("🔐 [Auth] Intento de login para:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ [Auth] Faltan credenciales");
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            console.log("❌ [Auth] Usuario NO encontrado en DB Docker:", credentials.email);
            return null;
          }

          console.log("✅ [Auth] Usuario encontrado:", user.id);

          if (!user.password) {
             console.log("❌ [Auth] El usuario no tiene contraseña (quizás usa Google login)");
             return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ [Auth] Contraseña incorrecta para:", credentials.email);
            return null;
          }

          console.log("✅ [Auth] Login exitoso para:", user.name);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
           console.error("🔥 [Auth] Error CRÍTICO de conexión a DB:", error);
           return null;
        }
        // --- DEBUGGING LOGS END ---
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
};