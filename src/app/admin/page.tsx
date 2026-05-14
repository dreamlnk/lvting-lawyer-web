"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useEffect, useState } from "react";
import "./dashboard.css";

interface Stats {
  articlesCount: number;
  categoriesCount: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ articlesCount: 0, categoriesCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      if (!res.ok) { window.location.href = "/admin/login"; return; }
      const [ar, cr] = await Promise.all([
        fetch("/api/articles?page=1&pageSize=5"),
        fetch("/api/categories"),
      ]);
      const ad = await ar.json();
      const cd = await cr.json();
      setStats({
        articlesCount: ad.total || 0,
        categoriesCount: Array.isArray(cd) ? cd.length : 0,
      });
    } catch {
      window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dash-loading">加载中...</div>;
  }

  return (
    <div className="dash-page">
      {/* 欢迎横幅 */}
      <div className="dash-banner">
        <h1 className="dash-banner-title">👋 欢迎回来，吕律师 <span className="page-file-path">src/app/admin/page.tsx</span></h1>
        <p className="dash-banner-sub">这里是您的网站管理后台，从这里可以快速管理文章和栏目。</p>
      </div>

      {/* 统计卡片 */}
      <div className="dash-stats">
        <div className="dash-stat-card dash-stat--blue">
          <div className="dash-stat-num">{stats.articlesCount}</div>
          <div className="dash-stat-label">文章总数</div>
        </div>
        <div className="dash-stat-card dash-stat--green">
          <div className="dash-stat-num">{stats.categoriesCount}</div>
          <div className="dash-stat-label">栏目数量</div>
        </div>
        <div className="dash-stat-card dash-stat--orange">
          <div className="dash-stat-num">80</div>
          <div className="dash-stat-label">服务端口</div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="dash-section">
        <h2 className="dash-section-title">快捷操作</h2>
        <div className="dash-actions">
          <Link href="/admin/articles"   className="dash-action-card">📝 文章管理</Link>
          <Link href="/admin/categories" className="dash-action-card">📁 栏目管理</Link>
          <a    href="/"   target="_blank"     className="dash-action-card">📰 查看网站</a>
        </div>
      </div>

      {/* 项目信息 */}
      <div className="dash-section">
        <h2 className="dash-section-title">项目信息</h2>
        <div className="dash-info-grid">
          <div className="dash-info-row">
            <span className="dash-info-label">项目路径</span>
            <code className="dash-info-val">D:\lvting-lawyer-web\</code>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">服务端口</span>
            <span className="dash-info-val">80</span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">数据库</span>
            <span className="dash-info-val">SQLite，已迁移 {stats.articlesCount} 篇</span>
          </div>
          <div className="dash-info-row">
            <span className="dash-info-label">框架</span>
            <span className="dash-info-val">Next.js 16 + App Router</span>
          </div>
        </div>
      </div>
    </div>
  );
}
