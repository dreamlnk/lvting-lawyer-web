# 吕婷律师网站 - 安装部署指南

**日期**: 2026-05-07  
**作者**: WorkBuddy AI

---

## 📋 系统架构

```
┌─────────────────────────────────────────┐
│         前端 (Next.js 14)              │
│   端口: 3000                          │
│   目录: /                             │
│   功能: 网站展示 + 后台管理界面       │
└──────────────────┬────────────────────┘
                   │ HTTP API
                   ↓
┌─────────────────────────────────────────┐
│         后端 (Node.js + Express)       │
│   端口: 3001                          │
│   目录: /backend                      │
│   功能: REST API + JWT认证           │
└──────────────────┬────────────────────┘
                   │ Prisma ORM
                   ↓
┌─────────────────────────────────────────┐
│         数据库 (MySQL 8.0)             │
│   数据库名: lvting_lawyer              │
│   功能: 存储文章、栏目、律师等数据  │
└─────────────────────────────────────────┘
```

---

## 🚀 完整安装步骤

### 第一步：安装前端依赖

```bash
# 进入项目目录
cd lvting-lawyer-website

# 安装依赖
npm install
```

### 第二步：配置前端环境变量

创建 `env.local` 文件：

```bash
# 后端API地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# 站点配置（可选，会从后端API获取）
NEXT_PUBLIC_SITE_NAME=吕婷律师
NEXT_PUBLIC_CONTACT_PHONE=0512-88822000
```

### 第三步：安装后端依赖

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install
```

### 第四步：配置数据库

#### 4.1 创建数据库

登录MySQL并创建数据库：

```sql
CREATE DATABASE lvting_lawyer 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

#### 4.2 配置后端环境变量

编辑 `backend/.env` 文件，修改数据库连接：

```env
# 修改为你自己的MySQL配置
DATABASE_URL="mysql://root:你的密码@localhost:3306/lvting_lawyer"

# 修改JWT密钥（建议改为随机字符串）
JWT_SECRET=your_random_secret_key_here

# 修改默认管理员密码（首次启动后会创建）
ADMIN_PASSWORD=your_strong_password
```

### 第五步：初始化数据库

```bash
# 生成Prisma Client
npm run prisma:generate

# 推送Schema到数据库
npm run prisma:migrate

# 初始化默认数据（管理员、栏目、配置）
npm run prisma:seed
```

输出示例：

```
✅ 默认管理员创建成功！
   用户名: admin
   密码: your_strong_password
   ⚠️  请登录后立即修改密码！

✅ 栏目创建成功: 律师风采
✅ 栏目创建成功: 刑事辩护
...

✅ 默认站点配置创建成功
✅ 示例律师创建成功: 吕婷

🎉 数据库初始化完成！
```

### 第六步：启动后端服务器

```bash
# 开发模式（自动重启）
npm run dev
```

输出示例：

```
🚀 吕婷律师网站后端API启动成功！
📍 服务器地址: http://localhost:3001
📚 API文档: http://localhost:3001/api/v1
🌱 环境: development
```

### 第七步：启动前端服务器

打开新终端：

```bash
# 回到项目根目录
cd ..

# 启动前端
npm run dev
```

输出示例：

```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environments: .env.local
```

---

## 🔐 首次登录

### 1. 访问后台登录页

浏览器打开：

```
http://localhost:3000/admin/login
```

### 2. 使用默认账号登录

```
用户名: admin
密码: your_strong_password (你在.env中设置的)
```

### 3. 登录后自动跳转

登录成功后，自动跳转到后台仪表盘：

```
http://localhost:3000/admin
```

### 4. 修改默认密码

**重要**：首次登录后请立即修改密码！

1. 点击右上角用户名
2. 选择"修改密码"
3. 输入原密码和新密码

---

## 📚 后台管理功能

### 仪表盘 (`/admin`)

显示统计信息：
- 文章总数
- 栏目总数
- 律师人数

### 文章管理 (`/admin/articles`)

功能：
- ✅ 查看文章列表（分页）
- ✅ 按状态筛选（已发布/草稿/已归档）
- ✅ 删除文章
- ⏳ 创建文章（开发中）
- ⏳ 编辑文章（开发中）

### 栏目管理 (`/admin/categories`)

功能：
- ✅ 查看栏目列表
- ✅ 删除栏目
- ⏳ 创建栏目（开发中）
- ⏳ 编辑栏目（开发中）

### 律师管理 (`/admin/lawyers`)

功能：
- ✅ 查看律师列表
- ✅ 删除律师
- ⏳ 创建律师（开发中）
- ⏳ 编辑律师（开发中）

### 站点配置 (`/admin/config`)

功能：
- ✅ 查看所有配置
- ✅ 编辑配置项
- ✅ 实时保存

---

## 🔧 常用操作

### 重启后端服务器

```bash
# Ctrl + C 停止服务器
# 然后重新启动
npm run dev
```

### 重启前端服务器

```bash
# Ctrl + C 停止服务器
# 然后重新启动
npm run dev
```

### 查看数据库（Prisma Studio）

```bash
cd backend
npm run prisma:studio
```

自动打开浏览器，显示数据库可视化界面。

### 重新初始化数据库

```bash
cd backend

# 删除数据库
mysql -u root -p -e "DROP DATABASE lvting_lawyer; CREATE DATABASE lvting_lawyer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 重新推送Schema
npm run prisma:migrate

# 重新初始化数据
npm run prisma:seed
```

---

## 🚨 故障排除

### 问题1：前端无法连接后端

**错误信息**：`Failed to fetch` 或 `Network Error`

**解决方案**：
1. 确认后端服务器已启动（http://localhost:3001）
2. 检查 `env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正确
3. 检查后端CORS配置（已默认允许所有来源）

### 问题2：数据库连接失败

**错误信息**：`Can't reach database server`

**解决方案**：
1. 确认MySQL服务已启动
2. 检查 `backend/.env` 中的 `DATABASE_URL` 是否正确
3. 确认数据库 `lvting_lawyer` 已创建

### 问题3：Prisma Client未生成

**错误信息**：`PrismaClient is not defined`

**解决方案**：

```bash
cd backend
npm run prisma:generate
```

### 问题4：JWT认证失败

**错误信息**：`认证失败，请重新登录`

**解决方案**：
1. 清除浏览器localStorage：`localStorage.clear()`
2. 重新登录
3. 检查 `backend/.env` 中的 `JWT_SECRET` 是否正确

### 问题5：端口被占用

**错误信息**：`Port 3000 is already in use`

**解决方案**：

```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程
taskkill //PID <PID> //F
```

---

## 📂 项目结构

```
lvting-lawyer-website/
├── backend/                      # 后端API系统
│   ├── src/
│   │   ├── index.ts             # 主服务器入口
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/             # 路由（模块化）
│   │   │   ├── auth.routes.ts
│   │   │   ├── article.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── lawyer.routes.ts
│   │   │   └── config.routes.ts
│   │   └── controllers/        # 控制器（业务逻辑）
│   │       ├── auth.controller.ts
│   │       ├── article.controller.ts
│   │       ├── category.controller.ts
│   │       ├── lawyer.controller.ts
│   │       └── config.controller.ts
│   ├── prisma/
│   │   ├── schema.prisma       # 数据库Schema
│   │   └── seed.ts            # 初始化脚本
│   ├── .env                    # 环境变量（需创建）
│   └── package.json
├── src/                        # 前端（Next.js）
│   └── app/
│       ├── admin/              # 后台管理页面
│       │   ├── login/         # 登录页
│       │   ├── page.tsx       # 仪表盘
│       │   ├── articles/      # 文章管理
│       │   ├── categories/    # 栏目管理
│       │   ├── lawyers/       # 律师管理
│       │   └── config/        # 站点配置
│       └── ...               # 前端展示页面
├── .env.local                  # 前端环境变量（需创建）
└── package.json
```

---

## 🎯 下一步计划

### 待完成功能

1. **文章编辑器**
   - 集成Markdown编辑器
   - 富文本编辑器
   - 图片上传

2. **数据迁移**
   - 从帝国CMS导入2,662篇文章
   - 图片资源迁移
   - URL重定向

3. **搜索功能**
   - 全文检索
   - 高级筛选

4. **优化**
   - 响应式优化
   - SEO优化
   - 性能优化

---

## 📞 技术支持

**开发者**: WorkBuddy AI  
**项目所有者**: 吕婷律师  
**文档版本**: v1.0  
**最后更新**: 2026-05-07

---

**安装完成后，你可以：**

1. 访问 `http://localhost:3000` 查看前端网站
2. 访问 `http://localhost:3000/admin/login` 登录后台
3. 访问 `http://localhost:3001/api/v1` 查看API文档

**祝你使用愉快！** 🎉
