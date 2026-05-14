/**
 * 文章迁移脚本
 * 从帝国CMS迁移到新站
 * 处理编码：GBK → UTF-8
 */

// 需要mysql连接时指定字符集
const mysql = require('mysql2/promise');

async function migrate() {
  // 旧站连接（GBK编码）
  const oldDb = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'empirecms',
    charset: 'GBK',
  });

  // 新站连接（UTF-8编码）
  const newDb = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'lvting_lawyer',
    charset: 'UTF8MB4',
  });

  console.log('开始迁移文章...');

  // 获取总数量
  const [countResult] = await oldDb.query(
    "SELECT COUNT(*) as cnt FROM phome_ecms_news WHERE classid IN (4,6,8,11,12,15,16,17,18,19)"
  );
  const total = countResult[0].cnt;
  console.log(`总文章数: ${total}`);

  // 分批迁移，每批100条
  const batchSize = 100;
  let migrated = 0;

  while (migrated < total) {
    const [articles] = await oldDb.query(`
      SELECT m.id, m.title, m.classid, m.titlepic, m.smalltext, m.newstime, m.diggtop,
             d.newstext, d.writer, d.befrom
      FROM phome_ecms_news m 
      LEFT JOIN phome_ecms_news_data_1 d ON m.id = d.id
      WHERE m.classid IN (4,6,8,11,12,15,16,17,18,19)
      ORDER BY m.id
      LIMIT ${batchSize} OFFSET ${migrated}
    `);

    if (articles.length === 0) break;

    for (const article of articles) {
      // 生成slug：从标题提取，中文转拼音或拼音首字母
      const title = article.title || '';
      const slug = generateSlug(title, article.id);

      // 处理分类ID映射（旧classid → 新id相同）
      const categoryId = article.classid;

      // 处理时间戳
      const publishedAt = article.newstime
        ? new Date(article.newstime * 1000).toISOString().slice(0, 19).replace('T', ' ')
        : null;

      try {
        await newDb.query(`
          INSERT INTO articles (
            title, slug, content, summary, category_id, author, source,
            views, is_featured, is_published, published_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          title,
          slug,
          article.newstext || '',
          article.smalltext || '',
          categoryId,
          article.writer || '吕婷律师',
          article.befrom || '',
          0,
          article.diggtop > 0 ? 1 : 0,
          1,
          publishedAt,
        ]);
      } catch (e) {
        // 忽略重复slug错误
        if (!e.message.includes('Duplicate')) {
          console.log(`导入失败: ${title} - ${e.message}`);
        }
      }
    }

    migrated += articles.length;
    console.log(`进度: ${migrated}/${total} (${Math.round(migrated/total*100)}%)`);

    // 每批后短暂休息，避免数据库压力
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`✓ 迁移完成: ${migrated} 篇`);

  await oldDb.end();
  await newDb.end();
}

// 生成slug
function generateSlug(title, id) {
  // 简单处理：取标题前30字符，替换特殊字符
  let slug = title
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-')  // 中文、英文、数字保留，其余替换为-
    .replace(/-+/g, '-')  // 多个-合并
    .replace(/^-|-$/g, '');  // 去除首尾-

  // 如果slug太长，截断
  if (slug.length > 30) {
    slug = slug.slice(0, 30);
  }

  // 如果为空或重复，加上ID
  return slug ? `${slug}-${id}` : `article-${id}`;
}

migrate().catch(console.error);
