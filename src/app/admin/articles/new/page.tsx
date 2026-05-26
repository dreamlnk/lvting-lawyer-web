"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dyn from "next/dynamic";

const SunEditorWrapper = dyn(() => import("@/components/SunEditorWrapper"), {
  ssr: false,
  loading: () => <div style={{padding:40,textAlign:"center",color:"#999"}}>加载编辑器中...</div>,
});

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    summary: "",
    categoryId: 2,
    content: "",
    status: "published",
  });
  const [saving, setSaving] = useState(false);
  const [checkingAI, setCheckingAI] = useState(false);
  const [checkingPlag, setCheckingPlag] = useState(false);
  const [detection, setDetection] = useState<{ aiScore: number; aiLevel: string; aiDimensions: any[]; aiMarkers: string[]; plagScore: number; plagLevel: string; plagMatches: any[]; wordCount: number }>({ aiScore: 0, aiLevel: "", aiDimensions: [], aiMarkers: [], plagScore: 0, plagLevel: "", plagMatches: [], wordCount: 0 });

  const checkAI = async () => {
    if (!form.content) return;
    setCheckingAI(true);
    try {
      const res = await fetch("/api/ai/check-originality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, content: form.content }) });
      const d = await res.json();
      if (d.ok) setDetection(prev => ({ ...prev, aiScore: d.aiDetection?.aiScore ?? 0, aiLevel: d.aiDetection?.level ?? "", aiDimensions: d.aiDetection?.dimensions ?? [], aiMarkers: d.aiDetection?.markers ?? [], wordCount: d.wordCount }));
    } catch {} finally { setCheckingAI(false); }
  };

  const checkPlag = async () => {
    if (!form.content) return;
    setCheckingPlag(true);
    try {
      const res = await fetch("/api/ai/check-originality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, content: form.content }) });
      const d = await res.json();
      if (d.ok) setDetection(prev => ({ ...prev, plagScore: d.score, plagLevel: d.level, plagMatches: d.contentCheck?.matches ?? [], wordCount: d.wordCount }));
    } catch {} finally { setCheckingPlag(false); }
  };

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, []);

  const checkAuth = async () => {
    const res = await fetch("/api/admin/check");
    if (!res.ok) router.push("/admin/login");
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data || []);
      setCategories(list);
      if (list.length > 0) {
        setForm(f => ({ ...f, categoryId: list[0].id }));
      }
    } catch {
      alert("加载栏目失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content) {
      alert("请输入文章内容");
      return;
    }

    setSaving(true);
    try {
      let finalSummary = form.summary;
      if (!finalSummary && form.content) {
        const plain = form.content.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
        if (plain.length > 10) {
          try {
            const sr = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "summary", content: plain }) });
            const sd = await sr.json();
            if (sd.ok && sd.result) { finalSummary = sd.result; setForm(f => ({ ...f, summary: sd.result })); }
          } catch {}
        }
      }
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, summary: finalSummary }),
      });

      if (res.ok) {
        alert("保存成功");
        router.push("/admin/articles");
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>新增文章 <span className="page-file-path" style={{fontSize:11,color:"#aaa",fontFamily:"monospace",fontWeight:400}}>src/app/admin/articles/new/page.tsx</span></h1>
        </div>
        <Link href="/admin/articles" style={styles.backLink}>
          返回列表
        </Link>
      </header>

      <main style={styles.main}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>副标题</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>摘要</label>
            <textarea
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              style={styles.textarea}
              rows={3}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>栏目 *</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
                style={styles.input}
                required
              >
                {categories.filter(c => !["jj","fengcai","shoufeibiaozhun"].includes(c.slug)).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>状态</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={styles.input}
              >
                <option value="published">立即发布</option>
                <option value="draft">保存为草稿</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>内容 *</label>
            <SunEditorWrapper
              value={form.content}
              onEditorChange={c => setForm(f => ({ ...f, content: c }))}
            />
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
                <button type="button" onClick={checkAI} disabled={checkingAI || !form.content}
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
                <button type="button" onClick={checkPlag} disabled={checkingPlag || !form.content}
                  style={{ fontSize: 11, color: checkingPlag ? "#bbb" : "#805ad5", background: "#f0f0f0", border: "none", padding: "2px 6px", borderRadius: 4, cursor: checkingPlag ? "wait" : "pointer", fontWeight: 500 }}>
                  {checkingPlag ? "⏳" : "查重"}
                </button>
              </div>
              <div style={{ width: 1, height: 20, background: "#eee", flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>文章字数</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>{detection.wordCount || (form.content ? form.content.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length : 0)}字</span>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? "保存中..." : "保存文章"}
            </button>
            <Link href="/admin/articles" style={styles.cancelLink}>
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  );}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#f5f5f5",
  },
  header: {
    background: "white",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#333",
  },
  backLink: {
    padding: "8px 16px",
    background: "#6c757d",
    color: "white",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "14px",
  },
  main: {
    maxWidth: "1200px",
    margin: "20px auto",
    padding: "0 30px",
  },
  form: {
    background: "white",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#666",
    fontWeight: 500,
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  textarea: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  saveBtn: {
    padding: "10px 30px",
    background: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: 500,
  },
  cancelLink: {
    padding: "10px 30px",
    background: "#6c757d",
    color: "white",
    textDecoration: "none",
    borderRadius: "4px",
    fontSize: "16px",
  },
};
