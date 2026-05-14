# 吕婷律师网站项目详细分析

## 项目概述

- **项目名称**：lvting-lawyer-web（吕婷律师网站）
- **技术栈**：Next.js 16.2.4 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **迁移目标**：从帝国CMS（EmpireCMS）迁移到 Next.js
- **开发端口**：3456（`npm run dev`）

---

## 架构设计

### 双数据库架构

| 用途 | 数据库 | 访问方式 | 状态 |
|------|--------|----------|------|
| 文章数据（旧站） | MySQL - `empirecms` | `mysql2/promise` 直连 | ✅ 已配置 |
| 管理后台认证 | SQLite - `prisma/dev.db` | Prisma ORM | ✅ 已配置 |

- **Prisma 7 注意事项**：`datasource` 块不再支持 `url` 字段，URL 写在 `prisma.config.ts` 里
- **实际数据访问**：`src/lib/db.ts`（mysql2 直连 empirecms），`src/lib/prisma.ts` 保留但未使用

### 目录结构

```
D:\lvting-lawyer-web\
├── src/
│   ├── app/
│   │   ├── (site)/           # 前台页面（layout 共享 Header/Footer）
│   │   │   ├── page.tsx     # 首页
│   │   │   ├── about/       # 关于律师
│   │   │   ├── contact/     # 联系方式
│   │   │   ├── fees/       # 收费标准
│   │   │   ├── search/      # 搜索页
│   │   │   ├── articles/[id]/  # 文章详情（空实现）
│   │   │   ├── category/[id]/  # 栏目文章列表（空实现）
│   │   │   └── robots.ts / sitemap.ts
│   │   ├── admin/           # 后台管理页面
│   │   │   ├── page.tsx    # 登录页
│   │   │   ├── dashboard/   # 仪表盘
│   │   │   ├── articles/    # 文章管理列表
│   │   │   ├── articles/[id]/  # 文章编辑页
│   │   │   └── categories/ # 栏目管理
│   │   ├── api/
│   │   │   ├── articles/[id]/route.ts  # 文章 API（GET/PUT/DELETE）✅
│   │   │   ├── articles/route.ts        # 文章列表/新增 API（GET/POST）✅
│   │   │   ├── categories/[id]/route.ts # 栏目 API ✅
│   │   │   ├── categories/route.ts      # 栏目列表 API ✅
│   │   │   ├── auth/route.ts           # 登录认证 API
│   │   │   └── v1/                    # 旧版 API（部分空实现）
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Header.tsx     # 导航栏（✅ 完成）
│   │   ├── Footer.tsx     # 页脚（✅ 完成）
│   │   ├── Pagination.tsx # 分页组件
│   │   └── SearchBox.tsx  # 搜索框组件
│   ├── lib/
│   │   ├── db.ts          # MySQL 直连层（✅ 核心完成）
│   │   ├── prisma.ts      # Prisma 客户端（保留未用）
│   │   ├── config.ts      # 网站联系信息配置
│   │   └── redirects.ts   # 301 重定向规则
│   └── middleware.ts      # Next.js 中间件（认证 + 重定向）
├── backend/               # Express 独立后端（可选，未启用）
│   ├── src/
│   │   ├── index.ts      # Express 入口
│   │   ├── routes/       # API 路由
│   │   ├── controllers/  # 控制器
│   │   └── middleware/   # 中间件
│   └── prisma/
│       └── schema.prisma # SQLite schema
├── public/
│   ├── xingshibianhu/    # 刑事辩护（静态HTML，432篇）
│   ├── hunyinjiating/    # 婚姻家庭（静态HTML，451篇）
│   ├── jiaotongshigu/    # 工伤交通（静态HTML，386篇）
│   ├── laodonggongshang/ # 劳动工伤（静态HTML，420篇）
│   ├── fangchan/         # 房产纠纷（静态HTML，95篇）
│   ├── jingjihetong/     # 经济合同（静态HTML，681篇）
│   ├── cx/               # 成功案例（静态HTML，382篇）
│   ├── fengcai/          # 律师风采（静态HTML，9篇）
│   └── shoufeibiaozhun/ # 收费标准（静态HTML，3篇）
├── prisma/
│   ├── schema.prisma     # Prisma schema（MySQL，Prisma 7格式）
│   └── prisma.config.ts  # Prisma 7 数据源配置
├── next.config.ts        # Next.js 配置（rewrites 关键）
├── middleware.ts         # 中间件（排除静态目录）
└── package.json
```

---

## 核心功能现状

### ✅ 已完成

1. **MySQL 数据访问层**（`src/lib/db.ts`）
   - `getCategories()` — 获取所有栏目
   - `getArticles()` — 分页文章列表（支持按栏目/关键词/推荐/有图筛选）
   - `getArticleById()` — 文章详情（不含正文）
   - `getArticleContent()` — 文章正文（from `phome_ecms_news_data_1`）
   - `getFullArticle()` — 完整文章（含正文）
   - `createArticle()` — 新增文章（事务：主表+内容表+索引表）
   - `updateArticle()` — 更新文章
   - `deleteArticle()` — 删除文章（事务）
   - `incrementViewCount()` — 浏览量+1

2. **API Routes**（Next.js App Router）
   - `GET /api/articles` — 文章列表 ✅
   - `POST /api/articles` — 新增文章 ✅
   - `GET /api/articles/[id]` — 文章详情 ✅
   - `PUT /api/articles/[id]` — 更新文章 ✅
   - `DELETE /api/articles/[id]` — 删除文章 ✅
   - `GET /api/categories` — 栏目列表 ✅
   - `GET /api/categories/[id]` — 栏目详情 ✅

3. **前台页面**
   - 首页 `/` ✅（静态内容，文章链接指向旧站 HTML）
   - 关于页 `/about` ✅
   - 联系页 `/contact` ✅
   - 收费标准 `/fees` ✅
   - Header/Footer ✅

4. **next.config.ts rewrites**
   - 旧站静态 HTML 文件通过 rewrites 正确路由
   - 支持 `/xingshibianhu/`、`/hunyinjiating/` 等 9 个栏目目录

5. **301 重定向**（`src/lib/redirects.ts`）
   - 旧帝国 CMS 动态 URL → 新站 URL
   - 精确匹配 + 正则匹配

---

### ⚠️ 未完成 / 待处理

1. **前台文章详情页** — `src/app/(site)/articles/[id]/page.tsx`
   - 当前是**模拟数据**，未连接真实 API
   - 需要改为 `getFullArticle(id)` 获取真实数据

2. **前台栏目文章列表页** — `src/app/(site)/category/[id]/page.tsx`
   - 文件存在但未读取到内容（需要确认）

3. **后台管理页面**（约 60% 完成）
   - 登录页 ✅
   - 仪表盘页（存在，功能待确认）
   - 文章管理列表页（存在，功能待确认）
   - 文章编辑页（存在，功能待确认）
   - **栏目管理页** — 存在但功能不完整

4. **搜索功能** — `src/app/(site)/search/page.tsx`
   - 页面存在，需确认是否连接 API

5. **2662 篇文章迁移**
   - 数据已在 MySQL `empirecms` 库中
   - 需要决定：是继续用 MySQL 直连，还是迁移到 Prisma 管理

6. **next.config.ts rewrites 补充**
   - 目前rewrites 对目录首页和文章都用了同一个规则
   - 需要确认 `/xingshibianhu/123.html` 这类 URL 是否正确映射

---

## 关键配置

### 联系信息（`src/lib/config.ts`）

| 项目 | 值 |
|------|-----|
| 咨询热线 | 0512-88822000 |
| 24小时热线 | 0512-69633555 |
| 微信号 | 282131（备注：苏州律师）|
| 地址 | 江苏省苏州市石湖西路君联商务大厦7楼720 |
| 律所 | 江苏臻万律师事务所 |
| 职位 | 合伙人、副主任律师 |

### 数据库配置（`.env`）

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=empirecms
```

### Prisma 7 配置（`prisma.config.ts`）

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "mysql://root:root@127.0.0.1:3306/empirecms",
  },
});
```

---

## 下一步建议

1. **连接前台文章详情页到 API** — 修改 `src/app/(site)/articles/[id]/page.tsx`
2. **完成后台文章管理功能** — 确认文章列表、新增、编辑、删除是否正常工作
3. **完成栏目管理页面** — 目前只有页面框架
4. **测试 rewrites 规则** — 确认旧站 URL 能正确访问静态 HTML
5. **决定数据迁移策略** — 继续用 mysql2 直连，还是完全迁移到 Prisma

---

## 已知问题

1. `src/app/(site)/articles/[id]/page.tsx` 第 10 行：`notFound` 从 `next/navigation` 导入，但在 App Router 中应从 `next` 导入
2. `src/app/api/v1/articles/route.ts` 使用了 `prisma.article.findMany`，但 Prisma schema 中模型名是 `Article`（需要确认是否正确映射）
3. `backend/` 目录是独立的 Express 后端，与 Next.js 内置 API Routes 功能重叠，需要确认是否保留

---

*分析时间：2026-05-10*
*分析者：WorkBuddy AI*
