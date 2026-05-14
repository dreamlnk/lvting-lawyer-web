/**
 * 帝国CMS MySQL → SQLite 迁移脚本（sql.js 版本）
 * 用法: npx tsx scripts/migrate-articles.ts
 */

import mysql from "mysql2/promise";
import initSqlJs from "sql.js";
import he from "he";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

async function main() {
  console.log("🔌 连接 MySQL...");
  const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "empirecms",
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log("📂 初始化 SQL.js...");
  const SQL = await initSqlJs();

  // 加载已有数据库文件（如果存在），否则创建新的
  let db: import("sql.js").Database;
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
    console.log("  已加载现有数据库");
  } else {
    db = new SQL.Database();
    console.log("  创建新数据库");
  }
  db.run("PRAGMA foreign_keys = ON");

  // 建表（如果不存在）
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    old_classid INTEGER,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    old_id INTEGER,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    summary TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    cover_image TEXT,
    author TEXT DEFAULT '吕婷律师',
    source TEXT,
    view_count INTEGER DEFAULT 0,
    is_top INTEGER DEFAULT 0,
    is_good INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  )`);
  console.log("  建表完成");

  function save() {
    // 确保目录存在
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }

  // ====== 1. 迁移栏目 ======
  console.log("\n📋 迁移栏目...");
  db.run("DELETE FROM categories");

  const [catRows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT classid, classname, classpath, bclassid, intro, myorder
     FROM phome_enewsclass
     WHERE classid IN (4,6,8,11,12,15,16,17,18,19)
     ORDER BY myorder ASC, classid ASC`
  );

  const classIdMap = new Map<number, number>();

  for (const row of catRows) {
    db.run(
      "INSERT INTO categories (old_classid, name, slug, description, sort_order) VALUES (?, ?, ?, ?, ?)",
      [row.classid, row.classname, row.classpath, (row.intro as string) || null, (row.myorder as number) || 0]
    );
    const result = db.exec("SELECT last_insert_rowid()");
    const newId = result[0]?.values[0]?.[0] as number;
    classIdMap.set(row.classid as number, newId);
    console.log(`  ✅ ${row.classname} (${row.classpath}) → id ${newId}`);
  }

  // ====== 2. 迁移文章 ======
  console.log("\n📝 迁移文章...");
  db.run("DELETE FROM articles");

  const [countRows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM phome_ecms_news WHERE classid IN (4,6,8,11,12,15,16,17,18,19)"
  );
  const total = countRows[0].cnt as number;
  console.log(`  共 ${total} 篇文章，开始分批读取...`);

  const BATCH = 500;
  let offset = 0;
  let migrated = 0;

  const insertStmt = db.prepare(
    `INSERT INTO articles (old_id, title, subtitle, content, summary, category_id, cover_image, author, source, view_count, is_top, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`
  );

  while (offset < total) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT n.id, n.classid, n.title, n.ftitle, n.smalltext, n.titlepic,
              n.onclick, n.newstime, n.istop, n.isgood, n.ispic, n.firsttitle,
              d.newstext, d.writer, d.befrom
       FROM phome_ecms_news n
       LEFT JOIN phome_ecms_news_data_1 d ON n.id = d.id
       WHERE n.classid IN (4,6,8,11,12,15,16,17,18,19)
       ORDER BY n.id ASC
       LIMIT ${BATCH} OFFSET ${offset}`
    );

    try {
      db.run("BEGIN TRANSACTION");
      for (const r of rows) {
        const catId = classIdMap.get(r.classid as number);
        if (!catId) {
          console.log(`  ⚠️ 跳过 id=${r.id}: 未找到栏目 classid=${r.classid}`);
          continue;
        }

        const content = r.newstext ? he.decode(r.newstext as string) : "";
        const summary = r.smalltext ? he.decode(r.smalltext as string) : "";
        const title = r.title ? he.decode(r.title as string) : "";

        insertStmt.bind([
          r.id,
          title,
          (r.ftitle as string) || null,
          content,
          summary || null,
          catId,
          (r.titlepic as string) || null,
          ((r.writer as string)?.trim() || "吕婷律师"),
          (r.befrom as string) || null,
          (r.onclick as number) || 0,
          (r.istop as number) === 1 ? 1 : 0,
          new Date((r.newstime as number) * 1000).toISOString(),
        ]);
        insertStmt.step();
        insertStmt.reset();
        migrated++;
      }
      db.run("COMMIT");
    } catch (err) {
      db.run("ROLLBACK");
      throw err;
    }

    offset += BATCH;
    console.log(`  ... ${Math.min(offset, total)} / ${total} (${migrated} migrated)`);
  }

  insertStmt.free();
  save();

  console.log(`\n✅ 迁移完成: ${migrated} 篇文章, ${classIdMap.size} 个栏目`);

  // ====== 3. 写入站点配置 ======
  console.log("\n⚙️  写入站点配置...");

  const siteConfigs: [string, string][] = [
    ["site_name", "苏州律师-苏州律师事务所免费咨询"],
    ["lawyer_name", "吕婷"],
    ["phone", "0512-888 22 000"],
    ["phone_24h", "0512-696 33 555"],
    ["wechat", "282131"],
    ["firm", "江苏臻万律师事务所"],
    ["address", "江苏省苏州市石湖西路君联商务大厦7楼720"],
  ];

  for (const [key, value] of siteConfigs) {
    db.run("INSERT OR REPLACE INTO site_config (key, value) VALUES (?, ?)", [key, value]);
  }
  save();
  console.log(`  ✅ ${siteConfigs.length} 条配置已写入`);

  // ====== 4. 验证 ======
  console.log("\n🔍 验证...");
  const artResult = db.exec("SELECT COUNT(*) as cnt FROM articles");
  const catResult = db.exec("SELECT COUNT(*) as cnt FROM categories");
  const artCount = artResult[0]?.values[0]?.[0] || 0;
  const catCount = catResult[0]?.values[0]?.[0] || 0;
  console.log(`  文章: ${artCount} 篇, 栏目: ${catCount} 个`);

  await pool.end();
  db.close();

  console.log("\n🎉 迁移成功！现在可以关掉 MySQL 了。");
}

main().catch((err) => {
  console.error("迁移失败:", err);
  process.exit(1);
});
