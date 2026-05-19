import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { checkAuthRateLimit } from "./rate-limit";

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
      async authorize(credentials, req) {

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // ================================================================
        // ⚡ FAIL FAST: Throttling — se ejecuta ANTES de Prisma y bcrypt
        // ================================================================
        const forwarded = req?.headers?.["x-forwarded-for"];
        const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        const clientIp = rawIp?.split(",")[0]?.trim() ?? "unknown";

        // Identificador dual: bloqueamos por email Y por IP de forma independiente.
        // Esto cubre tanto "credential stuffing" (misma IP, distintos emails)
        // como ataques dirigidos a una cuenta (misma cuenta, distintas IPs).
        const [emailCheck, ipCheck] = await Promise.all([
          checkAuthRateLimit(normalizedEmail, {
            limit: 5,
            window: "15 m",
            prefix: "ratelimit:auth:email",
          }),
          checkAuthRateLimit(clientIp, {
            limit: 20,
            window: "15 m",
            prefix: "ratelimit:auth:ip",
          }),
        ]);

        if (emailCheck.blocked) {
          console.warn(
            `[SECURITY] 🚫 Throttling activado para EMAIL: ${normalizedEmail} — ` +
            `Reintentar en ${emailCheck.retryAfterSeconds}s`
          );
          throw new Error(
            "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos."
          );
        }

        if (ipCheck.blocked) {
          console.warn(
            `[SECURITY] 🚫 Throttling activado para IP: ${clientIp} — ` +
            `Reintentar en ${ipCheck.retryAfterSeconds}s`
          );
          throw new Error(
            "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos."
          );
        }
        // ================================================================
        // ✅ Throttling superado — continúa con la autenticación estándar
        // ================================================================

        try {
          const user = await db.user.findUnique({
            where: {
              email: normalizedEmail,
            },
          });

          if (!user) {
            return null;
          }

          if (!user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // ===== Validar Estatus =====
          if (user.status === 'INACTIVO') {
            throw new Error("Tu cuenta está inactiva. Contacta al administrador.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("🔥 [Auth] Error en proceso de autorización:", error);
          throw error; // Re-lanzamos para que NextAuth propague el mensaje al cliente
        }
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
        session.user.permissions = token.permissions || null;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Consulta agresiva en cada refresco (ejecución del callback jwt)
      // para asegurar sincronización en tiempo real de los permisos y estado.
      try {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { permissions: true, role: true, status: true }
        });
        
        if (dbUser) {
          // Si el usuario fue desactivado mientras tenía sesión activa
          if (dbUser.status === 'INACTIVO') {
            token.role = 'INACTIVO' as any;
          } else {
            token.role = dbUser.role;
          }
          token.permissions = dbUser.permissions as Record<string, boolean> | null;
        }
      } catch (error) {
        console.error("🔥 [Auth] Error fetching user permissions for JWT:", error);
      }

      return token;
    },
  },
};