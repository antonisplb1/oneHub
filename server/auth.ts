import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, subusers, insertUserSchema, type User as SelectUser, type Subuser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export type User = SelectUser;

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

declare module 'express-session' {
  interface SessionData {
    adminId?: string;
    isSubuser?: boolean;
    subuserId?: string;
    permissions?: string[];
  }
}

declare module 'express' {
  interface Request {
    storeId?: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(
  supplied: string,
  stored: string
): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "merchant-hub-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: app.get("env") === "production",
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          // First check if it's a regular user
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (user) {
            const isValid = await comparePasswords(password, user.passwordHash);
            if (!isValid) {
              return done(null, false, { message: "Invalid email or password" });
            }
            // Regular user login - return with flag
            return done(null, { ...user, __isOwner: true });
          }

          // Check if it's a subuser
          const [subuser] = await db
            .select()
            .from(subusers)
            .where(eq(subusers.email, email))
            .limit(1);

          if (!subuser) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Verify subuser email is verified
          if (!subuser.emailVerified) {
            return done(null, false, { message: "Please verify your email first" });
          }

          // Verify subuser password
          if (!subuser.passwordHash) {
            return done(null, false, { message: "Please set up your password first" });
          }

          const isValid = await comparePasswords(password, subuser.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Get the owner's data
          const [owner] = await db
            .select()
            .from(users)
            .where(eq(users.id, subuser.ownerId))
            .limit(1);

          if (!owner) {
            return done(null, false, { message: "Owner account not found" });
          }

          // Return owner's data with subuser info attached
          return done(null, {
            ...owner,
            __isSubuser: true,
            __subuserId: subuser.id,
            __permissions: subuser.permissions || [],
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
