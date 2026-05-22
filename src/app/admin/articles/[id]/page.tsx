"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dyn from "next/dynamic";
import "./edit.css";

const SunEditorWrapper = dyn(() => import("@/components/SunEditorWrapper"), {
  ssr: false,
  loading: () => <div className="suneditor-loading" style={{ padding: 40, textAlign: "center", color: "#666" }}>富文本编辑器加载中...</div>,
});

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Article {
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
  category: { id: number; name: string; slug: string } | null;
}

const STANDALONE_SLUGS = ["jj", "fengcai", "shoufeibiaozhun"];
const standaloneSlugs = STANDALONE_SLUGS;

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id ? parseInt(params.id as string) : null;

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingAI, setCheckingAI] = useState(false);
  const [checkingPlag, setCheckingPlag] = useState(false);
  const [detection, setDetection] = useState<{ aiScore: number; aiLevel: string; aiDimensions: any[]; aiMarkers: string[]; plagScore: number; plagLevel: string; plagMatches: any[]; wordCount: number }>({ aiScore: 0, aiLevel: "", aiDimensions: [], aiMarkers: [], plagScore: 0, plagLevel: "", plagMatches: [], wordCount: 0 });

  const checkAI = async () => {
    if (!content) return;
    setCheckingAI(true);
    try {
      const res = await fetch("/api/ai/check-originality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
      const d = await res.json();
      if (d.ok) setDetection(prev => ({ ...prev, aiScore: d.aiDetection?.aiScore ?? 0, aiLevel: d.aiDetection?.level ?? "", aiDimensions: d.aiDetection?.dimensions ?? [], aiMarkers: d.aiDetection?.markers ?? [], wordCount: d.wordCount }));
    } catch {} finally { setCheckingAI(false); }
  };

  const checkPlag = async () => {
    if (!content) return;
    setCheckingPlag(true);
    try {
      const res = await fetch("/api/ai/check-originality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
      const d = await res.json();
      if (d.ok) setDetection(prev => ({ ...prev, plagScore: d.score, plagLevel: d.level, plagMatches: d.contentCheck?.matches ?? [], wordCount: d.wordCount }));
    } catch {} finally { setCheckingPlag(false); }
  };

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [coverImage, setCoverImage] = useState("");
  const [author, setAuthor] = useState("吕婷律师");
  const [source, setSource] = useState("");
  const [isTop, setIsTop] = useState(false);
  const [status, setStatus] = useState("published");

  useEffect(() => {
    if (!id) {
      router.push("/admin/articles");
      return;
    }
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      loadData();
      loadCategories();
    } catch {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        window.alert("文章不存在");
        router.push("/admin/articles");
        return;
      }
      const data = await res.json();
      setArticle(data);
      setTitle(data.title || "");
      setSubtitle(data.subtitle || "");
      setSummary(data.summary || "");
      setContent(data.content || "");
      setCategoryId(data.category_id || 0);
      setCoverImage(data.cover_image || "");
      setAuthor(data.author || "吕婷律师");
      setSource(data.source || "");
      setIsTop(data.is_top === 1);
      setStatus(data.status || "published");
    } catch {
      window.alert("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      setCategories(list);
    } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (!title.trim()) { window.alert("标题不能为空"); return; }
    if (!categoryId) { window.alert("请选择栏目"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          content,
          summary: summary || null,
          categoryId,
          coverImage: coverImage || null,
          author,
          source: source || null,
          isTop,
          status,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      window.alert("保存成功");
      loadData();
    } catch (err: any) {
      window.alert(err?.message || "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？此操作不可恢复！")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      window.alert("删除成功");
      router.push("/admin/articles");
    } catch (err: any) {
      window.alert(err?.message || "删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  if (!id) return null;
  if (loading) return <div className="edit-loading">加载中...</div>;
  if (!article) return null;

  return (
    <div className="edit-page">
      <div className="edit-header">
        <div>
          <h1 className="edit-title">编辑文章 <span className="page-file-path">src/app/admin/articles/[id]/page.tsx</span></h1>
          <div className="edit-path"></div>
        </div>
        <div className="edit-header-btns">
          <button onClick={handleSave} disabled={saving} className="edit-btn edit-btn--primary">
            {saving ? "保存中..." : "保存文章"}
          </button>
          <button onClick={handleDelete} disabled={deleting} className="edit-btn edit-btn--danger">
            {deleting ? "删除中..." : "删除文章"}
          </button>
          <Link href="/admin/articles" className="edit-back">返回列表</Link>
        </div>
      </div>

      <div className="edit-body">
        {loading && <div className="edit-loading-bar">数据加载中...</div>}

        <div className="edit-row">
          <div className="edit-field edit-field--half">
            <label className="edit-label">标题 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="edit-input" />
          </div>
          <div className="edit-field edit-field--half">
            <label className="edit-label">副标题</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="edit-input" />
          </div>
        </div>

        <div className="edit-row" style={{gap:8}}>
          <div className="edit-field edit-field--auto" style={{flex:1.8}}>
            <label className="edit-label">所属栏目 *</label>
            <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} className="edit-sel">
              <option value={0}>请选择栏目</option>
              {categories.filter(c => !standaloneSlugs.includes(c.slug)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="edit-field edit-field--auto" style={{flex:1}}>
            <label className="edit-label">状态</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="edit-sel">
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>
          <div className="edit-field edit-field--auto" style={{flex:1.2}}>
            <label className="edit-label">作者</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} className="edit-input" />
          </div>
          <div className="edit-field edit-field--auto" style={{flex:1.2}}>
            <label className="edit-label">来源</label>
            <input value={source} onChange={e => setSource(e.target.value)} className="edit-input" placeholder="可选" />
          </div>
          <div className="edit-field edit-field--auto" style={{flex:0.6, alignItems:"center", justifyContent:"center"}}>
            <label className="edit-label" style={{whiteSpace:"nowrap", marginBottom:0}}>
              <input type="checkbox" checked={isTop} onChange={e => setIsTop(e.target.checked)} />
              <span style={{ marginLeft: 4 }}>置顶</span>
            </label>
          </div>
        </div>

        <div className="edit-row">
          <div className="edit-field edit-field--half">
            <label className="edit-label">封面图 URL</label>
            <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="edit-input" placeholder="可选" />
          </div>
          <div className="edit-field edit-field--half"></div>
        </div>

        <div className="edit-field">
          <label className="edit-label">摘要</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} className="edit-textarea" rows={3} />
        </div>

        <div className="edit-field">
          <label className="edit-label">正文内容</label>
          <SunEditorWrapper value={content} onEditorChange={setContent} articleTitle={title} />
        </div>

        {/* 检测结果 */}
        <div style={{ background: "#fafafa", borderRadius: 8, padding: 16, border: "1px solid #eee" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" as const }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>AI化程度</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: detection.aiScore <= 50 ? "#2e7d32" : detection.aiScore <= 80 ? "#e65100" : "#c62828" }}>{detection.aiScore}%</span>
              {detection.aiScore > 0 && (
                <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, background: detection.aiScore <= 50 ? "#e6f9e6" : detection.aiScore <= 80 ? "#fff3e0" : "#fde8e8", color: detection.aiScore <= 50 ? "#2e7d32" : detection.aiScore <= 80 ? "#e65100" : "#c62828" }}>{detection.aiScore <= 50 ? "偏人工" : detection.aiScore <= 80 ? "偏AI" : "AI感强"}</span>
              )}
              <button onClick={checkAI} disabled={checkingAI || !content}
                style={{ fontSize: 11, color: checkingAI ? "#bbb" : "#805ad5", background: "#f0f0f0", border: "none", padding: "2px 6px", borderRadius: 4, cursor: checkingAI ? "wait" : "pointer", fontWeight: 500 }}>
                {checkingAI ? "⏳" : "AI检测"}
              </button>
            </div>
            <div style={{ width: 1, height: 20, background: "#eee", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>重复度</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: detection.plagScore >= 80 ? "#2e7d32" : detection.plagScore >= 50 ? "#e65100" : detection.plagScore === 0 ? "#999" : "#c62828" }}>{detection.plagScore > 0 ? 100 - detection.plagScore : 0}%</span>
              {detection.plagScore > 0 && (
                <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, background: detection.plagScore >= 80 ? "#e6f9e6" : detection.plagScore >= 50 ? "#fff3e0" : "#fde8e8", color: detection.plagScore >= 80 ? "#2e7d32" : detection.plagScore >= 50 ? "#e65100" : "#c62828" }}>{detection.plagScore >= 80 ? "原创" : detection.plagScore >= 50 ? "部分相似" : "重复较多"}</span>
              )}
              <button onClick={checkPlag} disabled={checkingPlag || !content}
                style={{ fontSize: 11, color: checkingPlag ? "#bbb" : "#805ad5", background: "#f0f0f0", border: "none", padding: "2px 6px", borderRadius: 4, cursor: checkingPlag ? "wait" : "pointer", fontWeight: 500 }}>
                {checkingPlag ? "⏳" : "查重"}
              </button>
            </div>
            <div style={{ width: 1, height: 20, background: "#eee", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>文章字数</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{detection.wordCount || (content ? content.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length : 0)}字</span>
            </div>
          </div>
        </div>

        <div className="edit-actions">
          <button onClick={handleSave} disabled={saving} className="edit-btn edit-btn--primary">
            {saving ? "保存中..." : "保存文章"}
          </button>
          <button onClick={() => { setTitle(article.title); setSubtitle(article.subtitle || ""); setContent(article.content || ""); }} className="edit-btn edit-btn--secondary">
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
