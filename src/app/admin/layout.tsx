"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import "./admin-layout.css";

const menu = [
  { href: "/admin",          label: "仪表盘",   icon: "📊" },
  { href: "/admin/articles",  label: "文章管理", icon: "📝" },
  { href: "/admin/categories", label: "栏目管理", icon: "📁" },
  { href: "/admin/site",      label: "网站设置", icon: "⚙️" },
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
  const isArticlesPage = mounted && pathname?.startsWith("/admin/articles") && pathname !== "/admin/articles/new";

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isArticlesPage) {
      fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data ?? d)).catch(() => {});
    }
  }, [isArticlesPage]);

  return (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <aside className="sidebar">
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
        <header className="top-bar">
          <span className="breadcrumb">
            {mounted && (
              <>
                <Link href="/admin" className="breadcrumb-link">仪表盘</Link>
                {pathname !== "/admin" && (
                  <>
                    <span className="breadcrumb-sep"> / </span>
                    <span className="breadcrumb-current">
                      {pathname?.startsWith("/admin/articles")
                        ? "文章管理"
                        : pathname?.startsWith("/admin/categories")
                        ? "栏目管理"
                        : ""}
                    </span>
                  </>
                )}
              </>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            {/* 文章管理页的栏目导航（固定顶端，不随页面滚动） */}
            {isArticlesPage && categories.length > 0 && (
              <span className="cat-nav-inline">
                {categories.filter(c => !STANDALONE_SLUGS.includes(c.slug)).map(c => (
                  <Link
                    key={c.id}
                    href={`/admin/articles?categoryId=${c.id}`}
                    className={"cat-nav-link" + (currentCatId === String(c.id) ? " cat-nav-link--active" : "")}
                  >{c.name}<span className="cat-nav-count">{c.article_count ?? 0}</span></Link>
                ))}
              </span>
            )}
            <form action="/api/admin/logout" method="POST" style={{ margin: 0, padding: 0 }}>
              <button type="submit" className="topbar-logout">退出</button>
            </form>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
