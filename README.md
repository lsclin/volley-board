# VolleyBoard 排协赛事与活动信息中心

VolleyBoard 是中国科学技术大学排协内部使用的移动端优先 Web 产品，定位是排协的**赛事与活动信息中心**，同时也是**管理员的工作与经验沉淀工具**。

它不替代 QQ 群，而是和 QQ 群分工：

- **QQ群**负责：即时通知、野球接龙、临时沟通、队伍内部交流。
- **VolleyBoard**负责：当前赛事展示、完整赛程、比赛结果、排名、比赛记录表和赛事资料、活动信息展示，以及管理员维护。

核心价值不是「让所有人每天使用网站」，而是当成员想知道**比赛什么时候打、赛事进行到哪里、排名如何、比赛记录表在哪里**时，有一个稳定且直观的入口。

## 项目定位

- 给成员看：当前赛事进度、完整赛程、比分、排名、赛事资料、近期比赛与活动。
- 给管理员用：管理赛事、队伍、比赛、比分、资料与活动，通过 Agent 助手减少重复劳动。
- 给协会留档：历届赛事、比赛记录表、排名和资料沉淀，让下一届管理员不需要重新摸索全部流程。

当前版本刻意保持轻量：

- 不做成员注册 / 登录 / 账号体系（只有管理员统一密码 + session）
- 不做报名系统
- 不做财务模块、宣传模块
- 不做多角色权限
- 不做 WebSocket 实时推送 / 邮件通知 / Push Notification
- 不做自动分队与复杂赛程生成

## 功能一览

### 看板（首页）

- 正在进行赛事：进度条、已完成场次、下一场比赛
- 近期场地安排：已确定时间的比赛与管理员发布的活动（今天 / 明天 / 周几分组）
- 最新赛果：最近结束的比赛与大比分
- 说明：QQ群负责即时通知和沟通，网站负责赛事与活动展示

首页不再展示野球签到、预计/已到人数和固定安排。

### 赛事模块

- `/schedule` 赛事列表（进行中 / 即将开始 / 历届赛事分组，含进度与下一场）
- `/schedule/[id]` 赛事详情：**概览 / 赛程 / 排名 / 资料** 四个 Tab
  - 概览：赛事进度、下一场比赛、最近赛果、参赛队伍
  - 赛程：按日期分组，支持「全部 / 待确认 / 即将比赛 / 已结束」筛选
  - 排名：胜场 → 积分 → 胜负局比 → 得失分比，移动端列表 + 展开详情
  - 资料：归属赛事的比赛规则、赛程图、比赛记录表等
- `/schedule/[id]/matches/[matchId]` 比赛详情：大比分、局分、比赛信息、比赛记录表入口
- 比赛支持**时间待确认**（pending）：先确定对阵，两队私下沟通后再补时间

### 管理员后台

- 统一管理员密码登录（无账号体系），验证后进入工作台
- `/admin` 工作台：当前赛事进度、快捷入口、由比赛状态推导的近期待办
- `/admin/competitions/[id]` 赛事工作区：概览 / 队伍 / 比赛 / 资料 / 设置，操作自动限定在当前赛事
- `/admin/activities` 活动管理（发布野球、训练等活动信息，复制群公告）
- `/admin/matches` 比赛管理（跨赛事筛选，补录比分、确认时间、取消、删除）
- `/admin/assistant` Agent 助手：自然语言 → 结构化草稿 → 预览 → 确认 → 白名单写入
- `/admin/manual` 管理员使用手册：网站定位、赛事流程、比赛状态、资料管理、Agent 用法、FAQ

### 赛事资料

- 支持添加外部资料链接
- 支持上传图片、PDF、表格等本地文件
- 上传文件保存到 Supabase Storage，不保存到 Render 本地文件系统
- 公开赛事详情页「资料」Tab 统一展示

### 管理员 Agent 助手

`/admin/assistant` 是只面向管理员的维护助手。它使用 DeepSeek 解析自然语言，但不会直接改数据库。

支持：生成QQ群公告、查询赛事信息、创建赛事、批量导入队伍、批量创建赛程、录入比分/局分。从赛事工作区进入时会携带当前赛事上下文，无需重复说明「哪个赛事」。

所有写操作都遵循：

```text
预览 -> 管理员确认 -> 执行
```

Agent 不支持删除操作，不允许执行任意 SQL，同一草稿（draftId）只能执行一次，所有写入记录到 AdminOperationLog。

## 页面导览

| 页面 | 用途 |
| --- | --- |
| `/` | 看板：正在进行赛事、近期场地安排、最新赛果 |
| `/schedule` | 赛事列表 |
| `/schedule/[id]` | 赛事详情（概览 / 赛程 / 排名 / 资料） |
| `/schedule/[id]/matches/[matchId]` | 比赛详情（比分、局分、记录表入口） |
| `/admin` | 管理员登录 + 工作台 |
| `/admin/competitions/[id]` | 赛事工作区 |
| `/admin/activities` | 活动管理 |
| `/admin/matches` | 比赛管理 |
| `/admin/assistant` | 管理员 Agent 助手 |
| `/admin/manual` | 管理员使用手册 |

## 技术栈

- Next.js App Router + TypeScript + Tailwind CSS
- Prisma（SQLite / Turso libSQL，运行时按 `DATABASE_URL` 前缀选择适配器）
- SWR（客户端数据获取与刷新）
- iron-session（管理员密码 + cookie session）
- Supabase Storage（赛事资料上传）
- DeepSeek API（管理员 Agent 助手）
- Render（生产部署）

## 数据模型

`prisma/schema.prisma`：

- `Competition` 赛事（名称/赛季/状态/日期/简介）
- `Team` 队伍（归属赛事，可空兼容历史数据）
- `Match` 比赛（`startAt` 可为空表示时间待确认；状态 pending/scheduled/finished/cancelled）
- `MatchSet` 局分
- `CompetitionFile` 赛事资料（外部链接或 Supabase URL）
- `Activity` 活动信息（野球、训练、友谊赛等，不再承载签到）
- `Attendance` 历史签到记录（保留模型，公共端已下线）
- `AdminOperationLog` Agent 写操作审计

## 设计原则

- Mobile First：手机宽度为第一优先级，桌面自然自适应
- 页面尽量单列，少用大表格，比赛按日期分组
- 排名使用移动端列表 + 展开详情
- 赛事内部使用 Tab，后台优先考虑「当前赛事上下文」
- 内容清晰优先于视觉炫技

## 开发与部署

```bash
npm install
# 配置 .env（参考 .env.example）
npm run db:migrate   # 应用迁移（生产用 prisma migrate deploy）
npm run dev
npm run build
```

- 本地默认使用 SQLite（`file:./dev.db`）；生产通过 `DATABASE_URL` 指向 Turso libSQL 或 PostgreSQL。
- Turso 上的历史迁移脚本在 `scripts/migrate-turso*.cjs`；新增迁移建议通过 `prisma migrate deploy` 或在 CI/本地对生产库执行。
- 生产冒烟测试：`PROD_URL=... ADMIN_PASSWORD=... node scripts/test-prod.cjs`（凭据一律通过环境变量传入，脚本内无硬编码）。

## 项目状态

当前项目已完成 V1 定位转型：公共端收敛为「看板 / 赛事 / 管理」，赛事详情升级为四 Tab 信息中心，比赛支持时间待确认，后台改为工作台 + 赛事工作区。

- 公共端：看板、赛事列表、赛事详情、比赛详情 ✅
- 后台：工作台、赛事工作区、活动/比赛管理 ✅
- Agent 助手（含赛事上下文）✅
- 管理员使用手册 ✅
- 野球签到、人数统计、固定安排：已从公共 UI 移除（数据模型保留）

后续如果继续扩展，建议仍然保持「小而实用」的方向，优先优化赛事详情与管理员维护体验。
