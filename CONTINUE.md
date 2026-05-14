# 继续工作 - 2026-05-10

## 当前状态

项目目录：`D:\lvting-lawyer-web\`

Dev server 已启动（webpack模式）：
```
npm run dev  (next dev --webpack -p 3456)
http://localhost:3456
```

## 昨天解决的问题

### 1. 登录页空白/500 错误
- 原因：Turbopack 在 Windows 上处理 CSS 时进程崩溃（exit code 0xc0000142）
- 修复：`package.json` 中 `dev` 脚本加 `--webpack` 标志，禁用 Turbopack

### 2. 其他已修复的问题
- `.env.local` 中 `NEXT_PUBLIC_API_URL` 指向错误端口 → 已注释
- `login/page.tsx` 中 `{ username }` 写法错误 → 已修复为 `{ username: formData.username }`
- `ArticleForm` TypeScript 类型错误 → `article` 字段改为可选

## 登录信息
- 账号：`admin`
- 密码：`lvting2024`
- 登录页：`http://localhost:3456/admin/login`

## 待完成

1. **验证登录页是否正常** - 用 webpack 模式重启后，确认 `/admin/login` 能正常显示
2. **测试 TinyMCE 编辑器** - 登录后访问 `/admin/articles/new`，确认编辑器正常加载
3. **测试文章保存 API** - 确认写入数据库正常
4. **文章增删改 API** - 后台管理核心功能（#14）
5. **分类管理页面** - (#15)
6. **迁移 2662 篇文章** - (#10/#18，从 empirecms 库迁移)
7. **next.config.ts rewrites 配置** - 旧文章静态路径转发

## 技术架构

- **框架**：Next.js 16.2.4 (App Router) + TypeScript
- **CSS**：Tailwind v4（`@import "tailwindcss"`）
- **数据库**：
  - `empirecms`（MySQL）- 文章数据，通过 `mysql2/promise` 直连
  - SQLite（`dev.db`）- 管理后台认证
- **Prisma**：已配置但未使用（mysql2 直连替代）
- **编辑器**：TinyMCE（已集成到后台）

## 数据库信息

- 主机：127.0.0.1:3306
- 用户：root / root
- 文章表：`phome_ecms_news` + `phome_ecms_news_data_1`
- 栏目数：9 个（classid 4/8/11/12/15/16/17/18/19）
- 文章总数：2662 篇

## 下一步（今天）

1. 浏览器打开 `http://localhost:3456/admin/login`，确认页面正常
2. 登录后测试 `/admin/articles/new` TinyMCE 编辑器
3. 测试保存文章，确认 API 正常写入
4. 继续完成后台管理功能
