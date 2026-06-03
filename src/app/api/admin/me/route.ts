import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    return Response.json({ isAdmin: !!session.isAdmin });
  } catch {
    return Response.json({ isAdmin: false });
  }
}