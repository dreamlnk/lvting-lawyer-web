"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import "./categories.css";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  article_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const standaloneSlugs = ["jj", "fengcai", "shoufeibiaozhun"];
  const filtered = categories.filter(c => !standaloneSlugs.includes(c.slug));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(Array.isArray(json) ? json : (json.data || []));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetch("/api/admin/check").then(r => { if (!r.ok) window.location.href = "/admin/login"; });
    load();
  }, []);

  const openNew = () => {
    setEditId(null);
    setFormName(""); setFormSlug(""); setFormOrder(categories.length + 1); setFormDesc("");
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setFormName(c.name); setFormSlug(c.slug); setFormOrder(c.sort_order); setFormDesc(c.description || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formSlug.trim()) { alert("名称和别名不能为空"); return; }
    setSaving(true);
    try {
      if (editId) {
        await fetch(`/api/categories/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), slug: formSlug.trim(), sort_order: formOrder, description: formDesc }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), slug: formSlug.trim(), sort_order: formOrder, description: formDesc }),
        });
      }
      setShowForm(false);
      load();
    } catch (e: any) { alert("保存失败"); } finally { setSaving(false); }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`确定删除栏目「${c.name}」吗？该栏目下的文章不会自动删除。`)) return;
    try {
      const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      load();
    } catch { alert("删除失败"); }
  };

  const moveOrder = async (c: Category, dir: number) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    const idx = sorted.findIndex(x => x.id === c.id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const swap = sorted[target];
    await Promise.all([
      fetch(`/api/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: swap.sort_order }) }),
      fetch(`/api/categories/${swap.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort_order: c.sort_order }) }),
    ]);
    load();
  };

  if (loading) return <div className="cat-loading">加载中...</div>;

  return (
    <div className="cat-page">
      <div className="cat-toolbar">
        <h2 className="cat-toolbar-title">栏目管理 <span className="page-file-path">src/app/admin/categories/page.tsx</span></h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="cat-toolbar-total">共 {categories.length} 个栏目（独立页 {standaloneSlugs.length} 个）</span>
          <button onClick={openNew} className="cat-btn cat-btn--primary">+ 新增栏目</button>
        </div>
      </div>

      {/* 新增/编辑表单弹窗 */}
      {showForm && (
        <div className="cat-overlay" onClick={() => setShowForm(false)}>
          <div className="cat-form-modal" onClick={e => e.stopPropagation()}>
            <h3 className="cat-form-title">{editId ? "编辑栏目" : "新增栏目"}</h3>
            <div className="cat-form-field">
              <label>名称 *</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className="cat-input" />
            </div>
            <div className="cat-form-field">
              <label>别名 *</label>
              <input value={formSlug} onChange={e => setFormSlug(e.target.value)} className="cat-input" placeholder="英文，如 xingshibianhu" />
            </div>
            <div className="cat-form-field">
              <label>排序</label>
              <input type="number" value={formOrder} onChange={e => setFormOrder(Number(e.target.value))} className="cat-input" style={{width:100}} />
            </div>
            <div className="cat-form-field">
              <label>描述</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="cat-textarea" rows={2} />
            </div>
            <div className="cat-form-actions">
              <button onClick={() => setShowForm(false)} className="cat-btn">取消</button>
              <button onClick={handleSave} disabled={saving} className="cat-btn cat-btn--primary">{saving ? "保存中..." : "保存"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 栏目列表 */}
      <div className="cat-grid">
        {filtered
          .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
          .map((c, i) => (
          <div key={c.id} className="cat-card">
            <div className="cat-card-top">
              <span className="cat-card-name">{c.name}</span>
              <span className="cat-card-id">#{c.id}</span>
            </div>
            <div className="cat-card-body">
              <div className="cat-row"><span className="cat-label">别名</span><code className="cat-code">{c.slug}</code></div>
              <div className="cat-row"><span className="cat-label">排序</span><span>{c.sort_order}</span></div>
              <div className="cat-row"><span className="cat-label">文章</span><span>{c.article_count ?? 0} 篇</span></div>
            </div>
            <div className="cat-card-actions">
              <button onClick={() => moveOrder(c, -1)} disabled={i === 0} className="cat-btn-small" title="上移">↑</button>
              <button onClick={() => moveOrder(c, 1)} disabled={i === categories.length - 1} className="cat-btn-small" title="下移">↓</button>
              <button onClick={() => openEdit(c)} className="cat-btn-small cat-btn-small--edit">编辑</button>
              <button onClick={() => handleDelete(c)} className="cat-btn-small cat-btn-small--delete">删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
