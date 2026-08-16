// 生产冒烟测试：登录后台并验证关键接口。
// 用法：
//   PROD_URL=https://xxx.onrender.com ADMIN_PASSWORD=xxx node scripts/test-prod.cjs
// 注意：不要在生产脚本中硬编码密码或地址，一律通过环境变量传入。
async function main() {
  const BASE = process.env.PROD_URL;
  const PASSWORD = process.env.ADMIN_PASSWORD;

  if (!BASE) {
    console.error("请设置 PROD_URL（例如 https://xxx.onrender.com）");
    process.exit(1);
  }
  if (!PASSWORD) {
    console.error("请设置 ADMIN_PASSWORD");
    process.exit(1);
  }

  console.log("1. Login...");
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  const setCookie = login.headers.get("set-cookie") || "";
  const cookies = setCookie.split(";")[0];
  console.log("  Status:", login.status, "Cookies:", cookies ? "OK" : "NONE");
  if (!cookies) {
    console.log("ERROR: No cookie received from login");
    process.exit(1);
  }

  console.log("2. Admin competitions...");
  const competitions = await fetch(`${BASE}/api/admin/competitions`, {
    headers: { Cookie: cookies },
  });
  const compData = await competitions.json().catch(() => null);
  console.log("  Status:", competitions.status, "Count:", Array.isArray(compData) ? compData.length : "n/a");

  console.log("3. Public home...");
  const home = await fetch(`${BASE}/api/home`);
  console.log("  Status:", home.status);

  console.log("4. Logout...");
  const logout = await fetch(`${BASE}/api/admin/logout`, {
    method: "POST",
    headers: { Cookie: cookies },
  });
  console.log("  Status:", logout.status);

  console.log("\n=== SMOKE TEST DONE ===");
}

main().catch(console.error);
