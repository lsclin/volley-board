import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();
    return Response.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "登出失败" }, { status: 500 });
  }
}