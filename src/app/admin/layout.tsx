"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import "./admin-layout.css";

const menu = [
  { href: "/admin",          label: "仪表盘",   icon: "📊" },
  { href: "/admin/articles",  label: "文章管理", icon: "📝" },
  { href: "/admin/categories", label: "栏目管理", icon: "📁" },
  { href: "/admin/ai-writer", label: "AI 写作",   icon: "🤖" },
  { href: "/admin/ai-settings", label: "AI 设置",   icon: "⚙️" },
  { href: "/admin/site",      label: "独立页管理", icon: "📄" },
  { href: "/",                label: "查看网站", icon: "📰", external: true },
];

interface Category { id: number; name: string; slug: string; article_count?: number; }

const STANDALONE_SLUGS = ["jj", "fengcai", "shoufeibiaozhun"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCatId = searchParams.get("categoryId") || "";
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isArticlesPage = mounted && pathname?.startsWith("/admin/articles") && pathname !== "/admin/articles/new";

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isArticlesPage) {
      fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data ?? d)).catch(() => {});
    }
  }, [isArticlesPage]);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="admin-layout">
      {/* 移动端遮罩 */}
      {mobileMenuOpen && <div className="mobile-menu-overlay show" onClick={closeMobile} />}

      {/* 侧边栏 */}
      <aside className={"sidebar" + (mobileMenuOpen ? " mobile-show" : "")}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">⚖</span>
          <div>
            <div className="sidebar-logo-title">吕婷律师</div>
            <div className="sidebar-logo-sub">管理后台</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const active = mounted && (
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href)
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                className={
                  "sidebar-nav-item" +
                  (active ? " sidebar-nav-item--active" : "")
                }
                onClick={closeMobile}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <form action="/api/admin/logout" method="POST" style={{ width: "100%" }}>
            <button
              type="submit"
              className={
                "sidebar-logout" +
                (hovered === "logout" ? " sidebar-logout--hover" : "")
              }
              onMouseEnter={() => setHovered("logout")}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="sidebar-nav-icon">🚪</span>
              <span>退出登录</span>
            </button>
          </form>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="main-area">
        {/* 顶部栏 */}
        <div className="top-bar">
          <div className="breadcrumb">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              ☰
            </button>
          </div>
          {isArticlesPage && categories.length > 0 && (
            <div className="cat-nav-inline">
              <span className="cat-nav-label">栏目：</span>
              <a href="/admin/articles" className={"cat-nav-link" + (!currentCatId ? " cat-nav-link--active" : "")}>全部</a>
              {categories.filter(c => !STANDALONE_SLUGS.includes(c.slug)).map(c => (
                <a key={c.id} href={`/admin/articles?categoryId=${c.id}`}
                  className={"cat-nav-link" + (currentCatId === String(c.id) ? " cat-nav-link--active" : "")}>
                  {c.name}
                </a>
              ))}
            </div>
          )}
          <form action="/api/admin/logout" method="POST" style={{ margin: 0 }}>
            <button type="submit" className="topbar-logout">退出</button>
          </form>
        </div>

        {/* 页面内容 */}
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
