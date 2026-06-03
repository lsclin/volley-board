import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAdmin?: boolean;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "volley-board-session-default-32-chars",
  cookieName: "volley_admin_session",
  ttl: 7200,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
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