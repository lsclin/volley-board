// 生产公开接口冒烟测试（无需登录）。
// 用法：
//   PROD_URL=https://xxx.onrender.com node scripts/test-prod-2.cjs
async function main() {
  const BASE = process.env.PROD_URL;

  if (!BASE) {
    console.error("请设置 PROD_URL（例如 https://xxx.onrender.com）");
    process.exit(1);
  }

  const checks = [
    ["/api/home", "看板聚合数据"],
    ["/api/competitions", "赛事列表"],
    ["/api/matches?limit=3", "比赛列表"],
    ["/api/rankings", "全局排名"],
    ["/api/health", "健康检查"],
  ];

  let failed = 0;
  for (const [path, label] of checks) {
    const res = await fetch(`${BASE}${path}`);
    console.log(`${label} (${path}):`, res.status);
    if (!res.ok) failed++;
  }

  console.log(failed === 0 ? "\n=== ALL PUBLIC CHECKS PASSED ===" : `\n=== ${failed} CHECK(S) FAILED ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(console.error);
