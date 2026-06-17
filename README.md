# VolleyBoard 排协活动看板

面向排协内部使用的轻量活动看板。第一核心是野球实时到场人数，第二核心是赛事、赛程、比分、排名和资料沉淀。

## 本地开发

```bash
npm install
npm run dev
```

默认本地数据库使用 SQLite 文件：

```env
DATABASE_URL="file:./dev.db"
```

本地数据库文件不会提交到 GitHub。

## 生产部署

生产环境不要依赖 `file:./dev.db`。Render 免费 Web Service 的本地文件系统不适合保存正式数据，重新部署或重启后可能丢失运行时写入的内容。

当前 Prisma schema 是 SQLite 方向，生产数据库建议优先使用 Turso / libSQL：

```env
DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-token"
ADMIN_PASSWORD="change-this"
SESSION_SECRET="change-this-to-a-random-string-at-least-32-chars"
```

Render 常用命令：

```bash
npm run build
npm run start
```

如果需要执行已存在的 Prisma migration：

```bash
npm run db:migrate
```

## 赛事资料

赛事资料不再上传到服务器本地文件系统。后台只保存资料名称、外部链接和类型。

推荐先把文件放在稳定的外部位置，例如：

- 飞书文档 / 腾讯文档
- 学校或协会资料库
- 网盘公开链接
- GitHub Release 或其他静态文件托管

然后在后台「赛事管理」里添加资料链接。

## 当前功能

- 首页野球活动实时人数：会来、到了
- 活动状态：未开始、进行中、已结束、已取消
- 历史活动统计
- 赛事列表和赛事详情
- 比赛安排、比分、赛事内排名
- 赛事资料外部链接
- 简单管理员后台
