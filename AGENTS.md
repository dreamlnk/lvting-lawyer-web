<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 本地发布工具 - 版本管理

每次打包前，手动更新 `scripts/publish-tool/package.json` 中的 `version` 字段（小版本 +0.0.1）。

## 本地发布工具 - 修改后验证

每次修改 `scripts/publish-tool/server.mjs` 的内嵌 HTML/JS 后，**必须**执行：
```powershell
cd scripts/publish-tool
node validate-js.js
```
`✅` 通过后再重启 server 或打包 exe。

## 操作规范

每次完成任务后，输出完整的操作摘要，包含：
- 修改了哪些文件
- 每个文件改了什么内容
- 改动的具体位置（行号或函数名）

**每次代码修改后，必须将改动摘要追加到 `.claude/CHANGELOG.md`**。如果文件超过 500MB，则保留旧文件不动，新建 `CHANGELOG-YYYYMMDD.md`（当天日期）继续记录。

## 模仿人类操作规范（防反爬虫）

所有平台发布脚本（publish-*.mjs）的每步自动化操作之间，**必须**加随机延时，避免触发平台的机器人检测：

- 每个独立动作（点击、输入、切换页面等）完成后 → 延时 **最少 2 秒**，值随机
- 用 `cdp.sleep(2000 + Math.random() * N)` 或封装 `randomDelay(label)` 函数
- 禁止连续操作之间没有延时
- 禁止使用固定延时值（如 `sleep(2000)`），必须是 `base + random` 形式

<!-- BEGIN:wechat-publish -->
# 公众号发布集成

## 架构
```
编辑文章页 → handlePublish() 遍历勾选平台
    ↓
┌─ 公众号 → POST /api/admin/wechat-publish → execFile(scripts/publish-wechat.mjs)
│          HumanCDP → Chrome CDP(ws://127.0.0.1:9222) → mp.weixin.qq.com
│          ↓ 填入标题+正文 → 保存草稿 → 更新 pub_gzh
│
├─ 百家号 → POST /api/admin/baijiahao-publish → execFile(scripts/publish-baijiahao.mjs)
│          HumanCDP → Chrome CDP → baijiahao.baidu.com
│          ↓ 填入标题+正文 → 保存草稿 → 更新 pub_bjh
│
└─ 头条   → POST /api/admin/toutiao-publish → execFile(scripts/publish-toutiao.mjs)
           HumanCDP → Chrome CDP → mp.toutiao.com
           ↓ 填入标题+正文 → 保存草稿 → 更新 pub_tt
```

## 核心文件
- `scripts/publish-wechat.mjs` — 公众号发布脚本
- `scripts/publish-baijiahao.mjs` — 百家号发布脚本
- `scripts/publish-toutiao.mjs` — 头条号发布脚本
- `src/app/api/admin/wechat-publish/route.ts` — 公众号 API
- `src/app/api/admin/baijiahao-publish/route.ts` — 百家号 API
- `src/app/api/admin/toutiao-publish/route.ts` — 头条号 API
- `src/app/api/publish/articles/route.ts` — 跨平台发布状态 API（GET 查文章 + PUT 更新 pub_*） 
- `D:\GongZhongHao\human-cdp\` — 浏览器自动化模块（模拟真人操作）

## 状态管理（admin/articles/[id]/page.tsx）
- `publishedPlatforms: Set<string>` — 已发布平台（pub_gzh/pub_bjh/pub_tt/pub_xhs 非空），checkbox 置灰不可操作
- `selectedPlatforms: Set<string>` — 勾选待发布的平台，默认 4 个全选（已发布的不计入）
- `handlePublish()` — 遍历 selectedPlatforms，按平台调用对应 API，成功后更新 published/selected

## 扩展新平台
1. 在 db.ts 的 ensureSchema() 添加 ALTER TABLE 新列
2. 更新 ArticleListItem / ArticleInput 接口和 CRUD
3. 创建 scripts/publish-xxx.mjs（HumanCDP 自动化）
4. 创建 src/app/api/admin/xxx-publish/route.ts
5. 在 handlePublish() 添加 else-if 分支
6. 更新本文档

## 注意事项
1. Chrome 必须 `--remote-debugging-port=9222` 启动
2. 需提前在各平台登录（Cookie 持久化）
3. 脚本运行在后台，不阻塞 API 响应
4. 百家号和头条编辑器选择器为通用匹配，首次使用需实测调优
5. 小红书暂未实施，预留 pub_xhs 列
<!-- END:wechat-publish -->
