import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from "sql.js";
import fs from "fs";
import path from "path";

// ============ 初始化 ============

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

let SQL: SqlJsStatic | null = null;
let _db: SqlJsDatabase | null = null;
let _schemaReady = false;

async function getDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;

  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file === 'sql-wasm.wasm') return wasmPath;
      return file;
    }
  });

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buf);
  } else {
    _db = new SQL.Database();
  }
  _db.run("PRAGMA foreign_keys = ON");
  ensureSchema();
  return _db;
}

function ensureSchema() {
  if (_schemaReady) return;
  const db = _db!;
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
    status TEXT DEFAULT 'published',
    published_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
  )`);
  db.run("CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_articles_status_date ON articles(status, published_at)");
  db.run("CREATE INDEX IF NOT EXISTS idx_articles_old_id ON articles(old_id)");
  db.run(`CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  )`);
  _schemaReady = true;
  saveDb();
}

function saveDb() {
  if (!_db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(_db.export()));
}

export async function initSchema() {
  await getDb();
  // ensureSchema() 已在 getDb() 中调用，这里无需重复
}

// ============ 查询辅助 ============

function dbAll<T = Record<string, unknown>>(sql: string, params?: unknown[] | Record<string, unknown>): T[] {
  const db = _db!;
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as any);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

function dbGet<T = Record<string, unknown>>(sql: string, params?: unknown[] | Record<string, unknown>): T | undefined {
  const rows = dbAll<T>(sql, params);
  return rows[0];
}

function dbRun(sql: string, params?: unknown[] | Record<string, unknown>): number {
  const db = _db!;
  db.run(sql, params as any);
  const result = db.exec("SELECT last_insert_rowid()");
  const lastId = (result[0]?.values?.[0]?.[0] as number) || 0;
  saveDb();
  return lastId;
}

// ============ 类型 ============

export interface DbCategory {
  id: number;
  old_classid: number | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_visible: number;
}

export interface ArticleListItem {
  id: number;
  old_id: number | null;
  old_path: string | null;
  title: string;
  subtitle: string | null;
  summary: string | null;
  category_id: number;
  cover_image: string | null;
  author: string;
  source: string | null;
  view_count: number;
  is_top: number;
  status: string;
  published_at: string;
  category: { id: number; name: string; slug: string } | null;
}

export interface ArticleFull extends ArticleListItem {
  content: string;
}

// ============ 栏目 ============

export interface CategoryWithCount extends DbCategory {
  article_count: number;
}

export async function getCategories(): Promise<DbCategory[]> {
  await getDb();
  return dbAll<DbCategory>("SELECT * FROM categories WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC");
}

/** 获取所有栏目及其文章数（只统计已发布） */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  await getDb();
  return dbAll<CategoryWithCount>(
    `SELECT c.*, COUNT(a.id) as article_count
     FROM categories c
     LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
     WHERE c.is_visible = 1
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.id ASC`
  );
}

export async function getAllCategories(): Promise<DbCategory[]> {
  await getDb();
  return dbAll<DbCategory>("SELECT * FROM categories ORDER BY sort_order ASC, id ASC");
}

export async function getCategoryById(id: number): Promise<DbCategory | null> {
  await getDb();
  return dbGet<DbCategory>("SELECT * FROM categories WHERE id = ?", [id]) || null;
}

export async function getCategoryBySlug(slug: string): Promise<DbCategory | null> {
  await getDb();
  return dbGet<DbCategory>("SELECT * FROM categories WHERE slug = ?", [slug]) || null;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  old_classid?: number | null;
  sort_order?: number;
  is_visible?: boolean;
}

export async function createCategory(input: CategoryInput): Promise<number> {
  await getDb();
  return dbRun(
    `INSERT INTO categories (name, slug, description, old_classid, sort_order, is_visible)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.slug, input.description || null, input.old_classid || null, input.sort_order || 0, input.is_visible !== false ? 1 : 0]
  );
}

export async function updateCategory(id: number, input: Partial<CategoryInput>): Promise<void> {
  await getDb();
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.name !== undefined) { sets.push("name = ?"); params.push(input.name); }
  if (input.slug !== undefined) { sets.push("slug = ?"); params.push(input.slug); }
  if (input.description !== undefined) { sets.push("description = ?"); params.push(input.description); }
  if (input.sort_order !== undefined) { sets.push("sort_order = ?"); params.push(input.sort_order); }
  if (input.is_visible !== undefined) { sets.push("is_visible = ?"); params.push(input.is_visible ? 1 : 0); }
  if (sets.length === 0) return;
  params.push(id);
  _db!.run(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`, params);
  saveDb();
}

export async function deleteCategory(id: number): Promise<void> {
  await getDb();
  _db!.run("DELETE FROM categories WHERE id = ?", [id]);
  saveDb();
}

// ============ 文章查询 ============

export async function getArticleCount(): Promise<number> {
  await getDb();
  const row = dbGet<{ cnt: number }>("SELECT COUNT(*) as cnt FROM articles");
  return row?.cnt || 0;
}

interface GetArticlesOpts {
  categoryId?: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export async function getArticles(opts: GetArticlesOpts = {}) {
  await getDb();
  const { categoryId, page = 1, pageSize = 20, keyword, status = "published" } = opts;

  const where: string[] = ["a.status = ?"];
  const params: unknown[] = [status];

  if (categoryId) { where.push("a.category_id = ?"); params.push(categoryId); }
  if (keyword) { where.push("(a.title LIKE ? OR a.summary LIKE ?)"); params.push(`%${keyword}%`, `%${keyword}%`); }

  const whereClause = where.join(" AND ");
  const offset = (page - 1) * pageSize;

  const countRow = dbGet<{ total: number }>(
    `SELECT COUNT(*) as total FROM articles a WHERE ${whereClause}`, params
  );

  const rows = dbAll<any>(
    `SELECT a.id, a.old_id, a.old_path, a.title, a.subtitle, a.summary, a.category_id,
            a.cover_image, a.author, a.source, a.view_count,
            a.is_top, a.status, a.published_at,
            c.id as cat_id, c.name as cat_name, c.slug as cat_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE ${whereClause}
     ORDER BY a.is_top DESC, a.published_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const articles: ArticleListItem[] = rows.map((r: any) => ({
    id: r.id,
    old_id: r.old_id || null,
    old_path: r.old_path || null,
    title: r.title,
    subtitle: r.subtitle || null,
    summary: r.summary || null,
    category_id: r.category_id,
    cover_image: r.cover_image || null,
    author: r.author,
    source: r.source || null,
    view_count: r.view_count,
    is_top: r.is_top,
    status: r.status,
    published_at: r.published_at,
    category: r.cat_id ? { id: r.cat_id, name: r.cat_name, slug: r.cat_slug } : null,
  }));

  return {
    total: countRow?.total || 0,
    page,
    pageSize,
    totalPages: Math.ceil((countRow?.total || 0) / pageSize),
    articles,
  };
}

export async function getArticleById(id: number): Promise<ArticleListItem | null> {
  await getDb();
  const row = dbGet<any>(
    `SELECT a.id, a.old_id, a.old_path, a.title, a.subtitle, a.summary, a.category_id,
            a.cover_image, a.author, a.source, a.view_count,
            a.is_top, a.status, a.published_at,
            c.id as cat_id, c.name as cat_name, c.slug as cat_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id = ?`, [id]
  );
  if (!row) return null;
  return {
    id: row.id,
    old_id: row.old_id || null,
    old_path: row.old_path || null,
    title: row.title,
    subtitle: row.subtitle || null,
    summary: row.summary || null,
    category_id: row.category_id,
    cover_image: row.cover_image || null,
    author: row.author,
    source: row.source || null,
    view_count: row.view_count,
    is_top: row.is_top,
    status: row.status,
    published_at: row.published_at,
    category: row.cat_id ? { id: row.cat_id, name: row.cat_name, slug: row.cat_slug } : null,
  };
}

export async function getArticleContent(id: number): Promise<string | null> {
  await getDb();
  const row = dbGet<{ content: string }>("SELECT content FROM articles WHERE id = ?", [id]);
  return row?.content || null;
}

export async function getFullArticle(id: number): Promise<ArticleFull | null> {
  const article = await getArticleById(id);
  if (!article) return null;
  const content = await getArticleContent(id);
  return { ...article, content: content || "" };
}

export async function getLatestArticles(limit = 10, categoryId?: number) {
  await getDb();
  let sql = `SELECT a.id, a.title, a.subtitle, a.summary, a.category_id,
             a.cover_image, a.author, a.source, a.view_count,
             a.is_top, a.status, a.published_at,
             c.id as cat_id, c.name as cat_name, c.slug as cat_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id`;
  const params: unknown[] = [];

  if (categoryId) { sql += " WHERE a.category_id = ? AND a.status = 'published'"; params.push(categoryId); }
  else { sql += " WHERE a.status = 'published'"; }

  sql += " ORDER BY a.published_at DESC LIMIT ?";
  params.push(limit);

  const rows = dbAll<any>(sql, params);
  return rows.map((r: any) => ({
    id: r.id, title: r.title, subtitle: r.subtitle || null, summary: r.summary || null,
    category_id: r.category_id, cover_image: r.cover_image || null, author: r.author,
    source: r.source || null, view_count: r.view_count, is_top: r.is_top,
    status: r.status, published_at: r.published_at,
    category: r.cat_id ? { id: r.cat_id, name: r.cat_name, slug: r.cat_slug } : null,
  }));
}

export async function getArticlesByIds(ids: number[]) {
  if (!ids.length) return [];
  await getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = dbAll<any>(
    `SELECT a.id, a.title, a.subtitle, a.summary, a.category_id,
            a.cover_image, a.author, a.source, a.view_count,
            a.is_top, a.status, a.published_at,
            c.id as cat_id, c.name as cat_name, c.slug as cat_slug
     FROM articles a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id IN (${placeholders})`, ids
  );
  return rows.map((r: any) => ({
    id: r.id, title: r.title, subtitle: r.subtitle || null, summary: r.summary || null,
    category_id: r.category_id, cover_image: r.cover_image || null, author: r.author,
    source: r.source || null, view_count: r.view_count, is_top: r.is_top,
    status: r.status, published_at: r.published_at,
    category: r.cat_id ? { id: r.cat_id, name: r.cat_name, slug: r.cat_slug } : null,
  }));
}

export async function incrementViewCount(id: number): Promise<void> {
  await getDb();
  _db!.run("UPDATE articles SET view_count = view_count + 1 WHERE id = ?", [id]);
  saveDb();
}

// ============ 文章写操作 ============

export interface ArticleInput {
  title: string;
  subtitle?: string | null;
  content: string;
  summary?: string | null;
  categoryId: number;
  coverImage?: string | null;
  author?: string;
  source?: string | null;
  isTop?: boolean;
  status?: string;
  publishedAt?: Date | null;
}

export async function createArticle(input: ArticleInput): Promise<number> {
  await getDb();
  const now = input.publishedAt?.toISOString() || new Date().toISOString();
  return dbRun(
    `INSERT INTO articles (title, subtitle, content, summary, category_id, cover_image, author, source, is_top, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.title, input.subtitle || null, input.content, input.summary || null,
     input.categoryId, input.coverImage || null, input.author || "吕婷律师",
     input.source || null, input.isTop ? 1 : 0, input.status || "published", now]
  );
}

export async function updateArticle(id: number, input: Partial<ArticleInput>): Promise<void> {
  await getDb();
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.title !== undefined) { sets.push("title = ?"); params.push(input.title); }
  if (input.subtitle !== undefined) { sets.push("subtitle = ?"); params.push(input.subtitle); }
  if (input.content !== undefined) { sets.push("content = ?"); params.push(input.content); }
  if (input.summary !== undefined) { sets.push("summary = ?"); params.push(input.summary); }
  if (input.categoryId !== undefined) { sets.push("category_id = ?"); params.push(input.categoryId); }
  if (input.coverImage !== undefined) { sets.push("cover_image = ?"); params.push(input.coverImage); }
  if (input.author !== undefined) { sets.push("author = ?"); params.push(input.author); }
  if (input.source !== undefined) { sets.push("source = ?"); params.push(input.source); }
  if (input.isTop !== undefined) { sets.push("is_top = ?"); params.push(input.isTop ? 1 : 0); }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status); }
  if (input.publishedAt !== undefined) {
    sets.push("published_at = ?");
    params.push(input.publishedAt ? input.publishedAt.toISOString() : new Date().toISOString());
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  params.push(id);
  _db!.run(`UPDATE articles SET ${sets.join(", ")} WHERE id = ?`, params);
  saveDb();
}

export async function deleteArticle(id: number): Promise<void> {
  await getDb();
  _db!.run("DELETE FROM articles WHERE id = ?", [id]);
  saveDb();
}

// ============ 站点配置 ============

export async function getSiteConfig(key: string): Promise<string | null> {
  await getDb();
  const row = dbGet<{ value: string }>("SELECT value FROM site_config WHERE key = ?", [key]);
  return row?.value || null;
}

export async function setSiteConfig(key: string, value: string): Promise<void> {
  await getDb();
  _db!.run("INSERT OR REPLACE INTO site_config (key, value) VALUES (?, ?)", [key, value]);
  saveDb();
}

// ============ 兼容旧 API ============

export function mapCategory(r: DbCategory) {
  return { id: r.id, name: r.name, slug: r.slug, parentId: null, description: r.description, coverImage: null };
}

export { saveDb };
