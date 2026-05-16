"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import dyn from "next/dynamic";

const SunEditorWrapper = dyn(() => import("@/components/SunEditorWrapper"), {
  ssr: false,
  loading: () => <div style={{padding:40,textAlign:"center",color:"#999"}}>加载编辑器中...</div>,
});

interface SitePage {
  slug: string;
  label: string;
  content: string;
}

export default function SiteSettingsPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("about");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/site/pages");
      const json = await res.json();
      const list = json.data || [];
      setPages(list);
      if (list.length > 0 && !activeSlug) setActiveSlug(list[0].slug);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetch("/api/admin/check").then(r => { if (!r.ok) window.location.href = "/admin/login"; });
    load();
  }, []);

  useEffect(() => {
    if (activeSlug) {
      const p = pages.find(x => x.slug === activeSlug);
      setContent(p?.content || "");
    }
  }, [activeSlug, pages]);

  const activePage = pages.find(p => p.slug === activeSlug);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/site/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: activeSlug, content }),
      });
      alert("保存成功");
      load();
    } catch { alert("保存失败"); } finally { setSaving(false); }
  };

  if (loading) return <div style={{padding:60,textAlign:"center",color:"#999"}}>加载中...</div>;

  return (
    <div style={{maxWidth:"100%",width:"100%",boxSizing:"border-box"}}>
      <div style={{
        background:"#fff", padding:"16px 20px", borderRadius:10,
        marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,0.1)",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <h2 style={{margin:0,fontSize:16,color:"#333"}}>
          独立页管理 <span className="page-file-path" style={{fontSize:11,color:"#aaa",fontFamily:"monospace",fontWeight:400,marginLeft:8}}>src/app/admin/site/page.tsx</span>
        </h2>
      </div>

      {/* Tab 切换 */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {pages.map(p => (
          <button
            key={p.slug}
            onClick={() => setActiveSlug(p.slug)}
            style={{
              padding:"8px 18px", borderRadius:8, border:"1px solid #ddd",
              background: activeSlug === p.slug ? "#3182ce" : "#fff",
              color: activeSlug === p.slug ? "#fff" : "#555",
              cursor:"pointer", fontSize:14, fontFamily:"inherit",
              transition:"all 0.15s",
            }}
          >{p.label}</button>
        ))}
      </div>

      {activePage && (
        <div style={{background:"#fff", borderRadius:10, boxShadow:"0 1px 3px rgba(0,0,0,0.1)", overflow:"hidden"}}>
          <div style={{padding:"16px 20px", borderBottom:"1px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <span style={{fontSize:15, fontWeight:500, color:"#333"}}>编辑：{activePage.label}</span>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding:"8px 24px", border:"none", borderRadius:6,
                background:"#3182ce", color:"#fff", cursor:"pointer",
                fontSize:14, fontFamily:"inherit",
                opacity: saving ? 0.6 : 1,
              }}
            >{saving ? "保存中..." : "保存页面"}</button>
          </div>
          <div style={{padding:"16px 20px"}}>
            <SunEditorWrapper value={content} onEditorChange={setContent} />
          </div>
        </div>
      )}
    </div>
  );
}
