"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./articles.css";

interface Category { id: number; name: string; slug: string; article_count?: number; }
interface Article { id: number; title: string; category: Category | null; published_at: string; view_count: number; is_top: number; status?: string; old_path?: string | null; }
interface ArticlesResponse { total: number; page: number; pageSize: number; totalPages: number; articles: Article[]; }

const STANDALONE_SLUGS = ["jj", "fengcai", "shoufeibiaozhun"];

export default function ArticlesPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ArticlesResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [catId, setCatId] = useState(searchParams.get("categoryId") || "");
  const [loading, setLoading] = useState(true);

  const load = async (p: number, kw: string, cid: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", p.toString());
    params.set("pageSize", "15");
    if (kw) params.set("keyword", kw);
    if (cid) params.set("categoryId", cid);
    try {
      const res = await fetch(`/api/articles?${params}`);
      if (!res.ok) throw new Error(`API错误 ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      window.alert("加载失败：" + e.message);
      console.error("load articles error", e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetch("/api/admin/check").then(r => { if (!r.ok) window.location.href = "/admin/login"; });
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data ?? d)).catch(() => {});
  }, []);

  // URL 参数变化时重新加载
  useEffect(() => {
    const urlCatId = searchParams.get("categoryId") || "";
    setCatId(urlCatId);
    setPage(1);
    load(1, keyword, urlCatId);
  }, [searchParams]);

  const goPage = (p: number) => { setPage(p); load(p, keyword, catId); };

  const handleDelete = async (articleId: number, title: string) => {
    if (!window.confirm(`确定删除「${title}」吗？此操作不可恢复！`)) return;
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `删除失败 (${res.status})`);
      }
      await load(page, keyword, catId);
      window.alert("删除成功");
    } catch (err: any) {
      window.alert(err?.message || "删除失败，请重试");
      console.error("delete error", err);
    }
  };

  if (loading || !data) return <div className="art-loading">加载中...</div>;

  return (
    <div className="art-page">
      <div className="page-file-path" style={{marginBottom:10}}>src/app/admin/articles/page.tsx</div>
      {/* 筛选栏 */}
      <div className="art-toolbar">
        <form onSubmit={e => { e.preventDefault(); setPage(1); load(1, keyword, catId); }} className="art-tool-row">
          <select value={catId} onChange={e => setCatId(e.target.value)} className="art-sel">
            <option value="">全部栏目（{data?.total ?? 0}）</option>
            {categories.filter(c => !STANDALONE_SLUGS.includes(c.slug)).map(c => <option key={c.id} value={c.id}>{c.name}（{c.article_count ?? 0}）</option>)}
          </select>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索标题..." className="art-input" />
          <button type="submit" className="art-btn art-btn--primary">搜索</button>
          {(keyword || catId) && (
            <button type="button" onClick={() => { setKeyword(""); setCatId(""); setPage(1); load(1, "", ""); }} className="art-btn art-btn--secondary">重置</button>
          )}
        </form>
        <div className="art-total">
          <Link href="/admin/articles/new" className="art-btn art-btn--primary" style={{marginRight:12, textDecoration:"none"}}>+ 新增文章</Link>
          共 {data.total} 篇
        </div>
      </div>

      {/* 表格 */}
      <div className="art-table-wrap">
        <table className="art-table">
          <thead>
            <tr>
              <th className="art-th">序号</th>
              <th className="art-th">标题</th>
              <th className="art-th">栏目</th>
              <th className="art-th">状态</th>
              <th className="art-th">浏览</th>
              <th className="art-th">发布时间</th>
              <th className="art-th">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.articles.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "art-tr--even" : "art-tr--odd"}>
                <td className="art-td">{(page - 1) * 15 + i + 1}</td>
                <td className="art-td art-td--title">
                  {a.is_top === 1 && <span className="art-badge-top">置顶</span>}
                  <a href={(a as any).old_path || `/articles/${a.id}`} target="_blank" className="art-title-link">{a.title}</a>
                </td>
                <td className="art-td">{a.category?.name || "-"}</td>
                <td className="art-td">
                  {a.status === "draft" ? (
                    <span style={{color:"#d69e2e",fontSize:12}}>草稿</span>
                  ) : a.status === "published" ? (
                    <span style={{color:"#38a169",fontSize:12}}>已发布</span>
                  ) : (
                    <span style={{color:"#999",fontSize:12}}>{a.status || "未知"}</span>
                  )}
                </td>
                <td className="art-td">{a.view_count}</td>
                <td className="art-td">{new Date(a.published_at).toLocaleDateString()}</td>
                <td className="art-td art-td--actions">
                  {(a as any).old_path ? (
                    <a href={(a as any).old_path} target="_blank" className="art-btn-small art-btn-small--view">查看</a>
                  ) : (
                    <a href={`/articles/${a.id}`} target="_blank" className="art-btn-small art-btn-small--view">查看</a>
                  )}
                  <Link href={`/admin/articles/${a.id}`} className="art-btn-small art-btn-small--edit">编辑</Link>
                  <button onClick={() => handleDelete(a.id, a.title)} className="art-btn-small art-btn-small--delete">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {data.totalPages > 1 && (
        <div className="art-pagination">
          <button onClick={() => goPage(1)}      disabled={page <= 1}  className="art-page-btn">首页</button>
          <button onClick={() => goPage(page - 1)} disabled={page <= 1}  className="art-page-btn">‹ 上一页</button>
          <span className="art-page-info">第 {page} / {data.totalPages} 页</span>
          <button onClick={() => goPage(page + 1)} disabled={page >= data.totalPages} className="art-page-btn">下一页 ›</button>
          <button onClick={() => goPage(data.totalPages)} disabled={page >= data.totalPages} className="art-page-btn">末页</button>
        </div>
      )}
    </div>
  );
}
