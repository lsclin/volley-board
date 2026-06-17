# VolleyBoard 排协活动看板

VolleyBoard 是面向校排协内部使用的轻量活动看板，不是传统社团官网。第一核心是野球实时到场人数，第二核心是赛事赛程、比分、排名和资料沉淀。

当前版本刻意不做成员注册/登录、不做报名系统、不做个人主页、不做论坛评论、不做球数或带球统计，也不做 WebSocket 实时推送。负责人能维护、成员愿意打开，是第一优先级。

## 当前功能

- 首页野球活动实时人数：会来、到了
- 活动状态：未开始、进行中、已结束、已取消
- 活动结束或取消后禁止继续签到
- 历史活动统计
- 赛事列表和赛事详情
- 比赛安排、比分、赛事内排名
- 赛事资料外部链接
- 简单管理员后台
- 微信群公告复制

## 本地开发

```bash
npm install
npm run dev
```

默认本地数据库使用 SQLite 文件：

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="local-admin-password"
SESSION_SECRET="change-this-to-a-random-string-at-least-32-chars"
```

本地数据库文件不会提交到 GitHub。`file:./dev.db` 只适合本机开发，不适合生产环境。

## 环境变量

生产环境建议使用 Turso / libSQL。真实值只放在 Render 环境变量里，不要写入代码或提交到 GitHub。

```env
DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"
ADMIN_PASSWORD="your-admin-password"
SESSION_SECRET="your-random-string-at-least-32-chars"
NODE_ENV="production"
```

说明：

- `DATABASE_URL`：数据库连接字符串。本地可用 `file:./dev.db`，生产推荐 `libsql://...`。
- `TURSO_AUTH_TOKEN`：使用 Turso / libSQL 云数据库时必填。
- `ADMIN_PASSWORD`：管理员后台登录密码。
- `SESSION_SECRET`：后台登录会话加密密钥，至少 32 个字符。
- `NODE_ENV`：Render 通常会自动设置为 `production`，也可以显式配置。

## 数据库

当前 Prisma schema 使用 SQLite provider，生产最顺滑的路线是 Turso / libSQL。项目已包含：

- `@libsql/client`
- `@prisma/adapter-libsql`

常用命令：

```bash
npm run db:generate
npm run db:migrate
npm run db:push
```

`db:migrate` 用于执行已有 migration；`db:push` 可用于把当前 schema 推到新的开发/测试数据库。生产数据迁移前先备份。

## Render 部署

Render 绑定 GitHub 仓库后，建议配置：

- Branch：`master`
- Build Command：`npm run build`
- Start Command：`npm run start`

必需环境变量：

```env
DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-turso-token"
ADMIN_PASSWORD="your-admin-password"
SESSION_SECRET="your-random-string-at-least-32-chars"
NODE_ENV="production"
```

部署后在 Render 的 deploy logs 或 GitHub commit 记录里确认部署 commit。当前应部署到最新的 `master` 提交。

注意：

- 不要在生产使用 Render 本地 SQLite 文件保存长期数据。
- Render 免费 Web Service 15 分钟无入站流量会休眠，再次打开通常会有约 1 分钟冷启动等待。
- Render 免费 Web Service 不适合作为长期文件存储。

## 赛事资料

赛事资料不上传到服务器本地文件系统。后台只保存资料名称、外部链接和类型。

推荐先把文件放在稳定的外部位置，例如：

- 飞书文档 / 腾讯文档
- 学校或协会资料库
- 网盘公开链接
- GitHub Release 或其他静态文件托管

然后在后台「赛事管理」里添加资料链接。这样重新部署或服务重启后，资料仍然可访问。

## 管理员后台

进入 `/admin` 后用 `ADMIN_PASSWORD` 登录。后台主要操作：

- 创建野球活动，设置时间、地点、备注
- 将活动从未开始切到进行中
- 活动结束后点击结束，取消时点击取消
- 创建赛事、队伍、比赛
- 录入比赛比分和局分
- 在赛事中添加资料链接
- 复制微信群公告

后台写操作都需要管理员登录。
