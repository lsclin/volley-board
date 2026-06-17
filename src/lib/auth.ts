import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAdmin?: boolean;
}

function getSessionPassword() {
  const password = process.env.SESSION_SECRET;
  if (password && password.length >= 32) return password;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }

  return "volley-board-session-default-32-chars";
}

function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: "volley_admin_session",
    ttl: 7200,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    },
  };
}

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions(),
  );
  return session;
}

export async function login(password: string): Promise<boolean> {
  if (password !== process.env.ADMIN_PASSWORD) {
    return false;
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();
  return true;
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.isAdmin) {
    throw new Error("Unauthorized");
  }
  return session;
}
