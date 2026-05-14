import mysql from "mysql2/promise";

// MySQL 连接 empirecms 数据库
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "root",
      database: "empirecms",
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

// 栏目类型
export interface MySQLCategory {
  id: number;          // classid
  name: string;        // classname
  slug: string;        // classpath
  description: string | null;
  sort_order: number;
  is_visible: number;
  classpath: string;
}

// 文章类型
export interface MySQLArticle {
  id: number;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string;
  category_id: number;
  cover_image: string | null;
  author: string;
  source: string | null;
  view_count: number;
  is_top: number;
  status: string;
  published_at: string;
  newstime: number;   // Unix timestamp
  category: { id: number; name: string; slug: string } | null;
}

// ============ 栏目 ============

export async function getAllCategoriesMySQL(): Promise<MySQLCategory[]> {
  const db = getPool();
  const [rows] = await db.query(
    "SELECT classid as id, classname as name, classpath as slug, classpath, intro as description, myorder as sort_order FROM phome_enewsclass WHERE showclass=0 ORDER BY myorder ASC, classid ASC"
  );
  return rows as MySQLCategory[];
}

export async function getCategoriesMySQL(): Promise<MySQLCategory[]> {
  const db = getPool();
  const [rows] = await db.query(
    "SELECT classid as id, classname as name, classpath as slug, classpath, intro as description, myorder as sort_order, 1 as is_visible FROM phome_enewsclass WHERE showclass=0 ORDER BY myorder ASC, classid ASC"
  );
  return rows as MySQLCategory[];
}

export async function getCategoryByIdMySQL(id: number): Promise<MySQLCategory | null> {
  const db = getPool();
  const [rows] = await db.query(
    "SELECT classid as id, classname as name, classpath as slug, classpath, intro as description, myorder as sort_order, 1 as is_visible FROM phome_enewsclass WHERE classid = ?",
    [id]
  );
  const r = (rows as any[])[0];
  return r || null;
}

// ============ 文章 ============

export async function getArticleCountMySQL(categoryId?: number, status?: string): Promise<number> {
  const db = getPool();
  let sql = "SELECT COUNT(*) as cnt FROM phome_ecms_news WHERE 1=1";
  const params: any[] = [];

  if (categoryId) {
    sql += " AND classid = ?";
    params.push(categoryId);
  }
  if (status) {
    sql += " AND istop = ?";
    params.push(status === "published" ? 0 : 1);
  }

  const [rows] = await db.query(sql, params);
  const r = (rows as any[])[0];
  return r?.cnt || 0;
}

export async function getArticlesMySQL(opts: {
  categoryId?: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}) {
  const { categoryId, page = 1, pageSize = 20, keyword, status = "published" } = opts;
  const db = getPool();
  const offset = (page - 1) * pageSize;

  let sql = `
    SELECT n.id, n.title, n.ismember as subtitle, n.titleurl as summary,
           n.classid as category_id, n.titlepic as cover_image,
           d.writer as author, d.befrom as source,
           n.onclick as view_count, n.istop, n.checkjs as status,
           n.newstime,
           c.classid as cat_id, c.classname as cat_name, c.classpath as cat_slug
    FROM phome_ecms_news n
    LEFT JOIN phome_ecms_news_data_1 d ON n.id = d.id
    LEFT JOIN phome_enewsclass c ON n.classid = c.classid
    WHERE n.id > 0
  `;
  const params: any[] = [];

  if (categoryId) {
    sql += " AND n.classid = ?";
    params.push(categoryId);
  }
  if (keyword) {
    sql += " AND n.title LIKE ?";
    params.push(`%${keyword}%`);
  }
  if (status === "published") {
    sql += " AND n.istop IN (0,1)"; // 全部显示
  }

  sql += " ORDER BY n.istop DESC, n.newstime DESC LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  const [rows] = await db.query(sql, params);

  // 总数
  let countSql = "SELECT COUNT(*) as cnt FROM phome_ecms_news n WHERE n.id > 0";
  const countParams: any[] = [];
  if (categoryId) { countSql += " AND n.classid = ?"; countParams.push(categoryId); }
  if (keyword) { countSql += " AND n.title LIKE ?"; countParams.push(`%${keyword}%`); }
  const [countRows] = await db.query(countSql, countParams);
  const total = (countRows as any[])[0]?.cnt || 0;

  const articles = (rows as any[]).map((r: any) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle || null,
    summary: r.summary || null,
    content: "",
    category_id: r.category_id,
    cover_image: r.cover_image || null,
    author: r.author || "吕婷律师",
    source: r.source || null,
    view_count: r.view_count || 0,
    is_top: r.istop || 0,
    status: "published",
    published_at: tsToDate(r.newstime),
    newstime: r.newstime,
    category: r.cat_id ? { id: r.cat_id, name: r.cat_name, slug: r.cat_slug } : null,
  }));

  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    articles,
  };
}

export async function getArticleByIdMySQL(id: number): Promise<MySQLArticle | null> {
  const db = getPool();
  const [rows] = await db.query(`
    SELECT n.id, n.title, n.ismember as subtitle, n.titleurl as summary,
           n.classid as category_id, n.titlepic as cover_image,
           d.writer as author, d.befrom as source,
           n.onclick as view_count, n.istop, n.checkjs as status,
           n.newstime,
           c.classid as cat_id, c.classname as cat_name, c.classpath as cat_slug
    FROM phome_ecms_news n
    LEFT JOIN phome_ecms_news_data_1 d ON n.id = d.id
    LEFT JOIN phome_enewsclass c ON n.classid = c.classid
    WHERE n.id = ?
  `, [id]);

  const r = (rows as any[])[0];
  if (!r) return null;

  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle || null,
    summary: r.summary || null,
    content: "",
    category_id: r.category_id,
    cover_image: r.cover_image || null,
    author: r.author || "吕婷律师",
    source: r.source || null,
    view_count: r.view_count || 0,
    is_top: r.istop || 0,
    status: "published",
    published_at: tsToDate(r.newstime),
    newstime: r.newstime,
    category: r.cat_id ? { id: r.cat_id, name: r.cat_name, slug: r.cat_slug } : null,
  };
}

export async function getArticleContentMySQL(id: number): Promise<string | null> {
  const db = getPool();
  const [rows] = await db.query("SELECT newstext FROM phome_ecms_news_data_1 WHERE id = ?", [id]);
  const r = (rows as any[])[0];
  return r?.newstext || null;
}

// 工具函数
function tsToDate(ts: number): string {
  // ts 是秒，MySQL 存的是 Unix 时间戳
  return new Date(ts * 1000).toISOString();
}
