import { login } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    const success = await login(password);

    if (!success) {
      return Response.json({ error: "密码错误" }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "登录失败" }, { status: 500 });
  }
}