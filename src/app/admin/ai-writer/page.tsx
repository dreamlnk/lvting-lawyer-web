"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const STYLES = ["原创写作", "改写", "仿写", "追热点", "问答式", "案例评析", "法规解读"];
const THEMES = ["经典", "蓝色", "橙色", "灰白"];

export default function AiWriterPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [style, setStyle] = useState("原创写作");
  const [theme, setTheme] = useState("经典");

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<number>(0);
  const [detectingCat, setDetectingCat] = useState(false);

  const [urlInput, setUrlInput] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [searchingKeyword, setSearchingKeyword] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [autoGenerating, setAutoGenerating] = useState("");

  const [titleLines, setTitleLines] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [titleLoading, setTitleLoading] = useState(false);
  const [titleError, setTitleError] = useState("");

  const [summaryResult, setSummaryResult] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [articleResult, setArticleResult] = useState("");
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  const [publishing, setPublishing] = useState<string | null>(null);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/admin/check").then(r => { if (!r.ok) router.push("/admin/login"); });
    fetch("/api/categories").then(r => r.json()).then(d => {
      const list = d.data || d || [];
      setCategories(list);
      const normal = list.filter((c: any) => !["jj","fengcai","shoufeibiaozhun"].includes(c.slug));
      if (normal.length > 0) setSelectedCat(normal[0].id);
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    const val = urlInput.trim();
    if (!val.startsWith("http")) return;
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => runAutoPipeline(val), 400);
    return () => { if (urlTimerRef.current) clearTimeout(urlTimerRef.current); };
  }, [urlInput]);

  const runAutoPipeline = async (url: string) => {
    setAutoGenerating("正在抓取链接内容...");
    setFetchingUrl(true);
    try {
      const fr = await fetch("/api/ai/fetch-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const fd = await fr.json();
      if (!fd.ok) { setAutoGenerating(""); setFetchStatus("❌ 抓取失败: " + (fd.error || "")); return; }
      const prefix = content.trim() ? content + "\n\n" : "";
      setContent(prefix + "【以下内容从链接抓取】\n" + fd.content);
      setFetchStatus("✅ 已抓取 " + fd.content.length + " 字");
      if (!topic.trim() && fd.title) setTopic(fd.title);
      await genAll(fd.title || "", fd.content);
    } catch { setAutoGenerating(""); setFetchStatus("❌ 网络错误"); }
    finally { setFetchingUrl(false); }
  };

  const genAll = async (t: string, c: string) => {
    setAutoGenerating("正在生成标题...");
    try {
      const tr = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "title", style, theme, topic: t, content: c.substring(0, 3000) }) });
      const td = await tr.json();
      if (td.ok) { const ls = td.result.split("\n").filter((l: string) => l.trim()); setTitleLines(ls); setSelectedTitle(0); }
    } catch {}
    setAutoGenerating("正在生成摘要...");
    try {
      const sr = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "summary", style, theme, topic: t, content: c.substring(0, 4000) }) });
      const sd = await sr.json();
      if (sd.ok) setSummaryResult(sd.result);
    } catch {}
    setAutoGenerating("正在生成全文...");
    try {
      const ar = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "article", style, theme, topic: t, content: c }) });
      const ad = await ar.json();
      if (ad.ok) setArticleResult(ad.result);
    } catch {}
    setAutoGenerating("");
  };

  // 关键词搜索
  const handleKeywordSearch = async () => {
    const kw = keywordSearch.trim();
    if (!kw) { alert("请输入关键词"); return; }
    setSearchingKeyword(true);
    setFetchStatus("正在搜索 " + kw + "...");
    setSearchResults([]);
    try {
      const res = await fetch("/api/ai/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: kw }) });
      const data = await res.json();
      if (data.ok && data.results?.length > 0) {
        setSearchResults(data.results);
        setFetchStatus("✅ 找到 " + data.results.length + " 条结果，请点击选择");
        if (!topic.trim()) setTopic(kw);
      } else {
        setFetchStatus("❌ " + (data.error || "未找到结果"));
      }
    } catch { setFetchStatus("❌ 网络错误"); }
    finally { setSearchingKeyword(false); }
  };

  const pickSearchResult = (url: string) => {
    setSearchResults([]);
    setUrlInput(url);
  };

  const generate = async (type: "title" | "summary" | "article") => {
    if (!topic.trim() && !content.trim()) { alert("请输入主题或参考内容"); return; }
    const sl = type === "title" ? setTitleLoading : type === "summary" ? setSummaryLoading : setArticleLoading;
    const se = type === "title" ? setTitleError : type === "summary" ? setSummaryError : setArticleError;
    const sr = type === "title" ? (r: string) => { const ls = r.split("\n").filter(l => l.trim()); setTitleLines(ls); setSelectedTitle(0); } : type === "summary" ? setSummaryResult : setArticleResult;
    sl(true); se(""); type === "title" ? setTitleLines([]) : type === "summary" ? setSummaryResult("") : setArticleResult("");
    try {
      const res = await fetch("/api/ai/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, style, theme, topic: topic.trim(), content: content.trim() || undefined }) });
      const d = await res.json();
      if (d.ok) sr(d.result); else se(d.error || "生成失败");
    } catch { se("网络错误"); } finally { sl(false); }
  };

  const publishArticle = async (source: "title" | "summary" | "article", asDraft = false) => {
    if (!selectedCat) { alert("请选择栏目"); return; }
    const articleTitle = selectedTitle >= 0 && titleLines[selectedTitle] ? titleLines[selectedTitle] : topic.trim() || "无标题";
    let articleContent = source === "article" && articleResult ? articleResult : source === "summary" && summaryResult ? "<p>" + summaryResult + "</p>" : "<p>" + (content || topic) + "</p>";
    const otherTitles = titleLines.filter((_, i) => i !== selectedTitle);
    if (otherTitles.length > 0) { articleContent += "\n<p><b>相关标题：</b></p>\n"; otherTitles.forEach(t => { articleContent += "<p>" + t + "</p>\n"; }); }
    setPublishing(source);
    try {
      const res = await fetch("/api/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: articleTitle, content: articleContent, summary: summaryResult || null, categoryId: selectedCat, status: asDraft ? "draft" : "published" }) });
      const d = await res.json();
      if (res.ok) { alert((asDraft ? "草稿" : "文章") + "已保存成功！ID: " + d.id); router.push("/admin/articles"); }
      else alert("保存失败: " + (d.error || "未知错误"));
    } catch { alert("网络错误"); } finally { setPublishing(null); }
  };

  const clearAll = () => { setTopic(""); setContent(""); setUrlInput(""); setKeywordSearch(""); setFetchStatus(""); setSearchResults([]); setAutoGenerating(""); setTitleLines([]); setSelectedTitle(0); setSummaryResult(""); setArticleResult(""); setTitleError(""); setSummaryError(""); setArticleError(""); };

  return (
    <div style={{ maxWidth: 1024, margin: "0 auto", padding: "20px" }}>
      <div style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><h1 style={s.title}>AI 写作助手</h1><p style={s.desc}>搜索 → 选文章 → 自动抓取 → 自动生成</p></div>
        <button onClick={clearAll} style={{ padding: "6px 16px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", color: "#999", fontSize: 13, cursor: "pointer" }}>清空</button>
      </div>

      <div style={s.card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 14 }}>
          <div><label style={s.label}>写作形式</label><select value={style} onChange={e => setStyle(e.target.value)} style={s.select}>{STYLES.map(st => <option key={st} value={st}>{st}</option>)}</select></div>
          <div><label style={s.label}>风格主题</label><select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...s.select, borderColor: theme === "经典" ? "#d69e2e" : theme === "蓝色" ? "#3182ce" : theme === "橙色" ? "#dd6b20" : "#718096" }}>{THEMES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label style={s.label}>所属栏目</label><select value={selectedCat} onChange={e => setSelectedCat(Number(e.target.value))} style={s.select}>{categories.filter((c: any) => !["jj","fengcai","shoufeibiaozhun"].includes(c.slug)).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={s.label}>文章主题</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="如：天降钢管砸伤" style={s.input} /></div>
        </div>

        {/* 关键词搜索 */}
        <div style={s.field}>
          <label style={s.label}>关键词搜索（输入关键词，搜索相关文章后点击选择）</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={keywordSearch} onChange={e => setKeywordSearch(e.target.value)} placeholder="如：成都男子被天降钢管砸伤" style={{ ...s.input, flex: 1 }}
              onKeyDown={e => { if (e.key === "Enter") handleKeywordSearch(); }} />
            <button onClick={handleKeywordSearch} disabled={searchingKeyword} style={{ padding: "9px 16px", border: "1px solid #e53e3e", borderRadius: 4, background: searchingKeyword ? "#fff5f5" : "#fff", color: searchingKeyword ? "#999" : "#e53e3e", fontSize: 13, cursor: searchingKeyword ? "wait" : "pointer", fontWeight: 500, whiteSpace: "nowrap" as const }}>
              {searchingKeyword ? "搜索中..." : "🔍 搜索"}
            </button>
          </div>
        </div>

        {/* 搜索结果列表 */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: 8, border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
            {searchResults.map((r, i) => (
              <div key={i} onClick={() => pickSearchResult(r.url)}
                style={{ padding: "10px 14px", borderBottom: i < searchResults.length - 1 ? "1px solid #edf2f7" : "none", cursor: "pointer", background: "#fafafa", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#ebf8ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fafafa")}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#2b6cb0", marginBottom: 3 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "#718096" }}>{r.snippet?.substring(0, 120)}</div>
                <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 2 }}>{r.url?.substring(0, 80)}</div>
              </div>
            ))}
          </div>
        )}

        {/* 原文链接 */}
        <div style={s.field}>
          <label style={s.label}>原文链接（从搜索结果点击选择，或手动粘贴）</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="点击搜索结果自动填入" style={{ ...s.input, flex: 1 }} />
            <button onClick={async () => {
              const u = urlInput.trim();
              if (!u.startsWith("http")) { setFetchStatus("❌ 请输入有效链接"); return; }
              setFetchingUrl(true); setFetchStatus("正在抓取...");
              try {
                const r = await fetch("/api/ai/fetch-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: u }) });
                const d = await r.json();
                if (d.ok) {
                  const p = content.trim() ? content + "\n\n" : "";
                  setContent(p + "【以下内容从链接抓取】\n" + d.content);
                  if (!topic.trim() && d.title) setTopic(d.title);
                  setFetchStatus("✅ 已抓取 " + d.content.length + " 字");
                  await genAll(d.title || "", d.content);
                } else { setFetchStatus("❌ " + (d.error || "")); }
              } catch { setFetchStatus("❌ 网络错误"); }
              finally { setFetchingUrl(false); }
            }} disabled={fetchingUrl} style={{ padding: "9px 16px", border: "1px solid #805ad5", borderRadius: 4, background: fetchingUrl ? "#f5f0ff" : "#fff", color: fetchingUrl ? "#999" : "#805ad5", fontSize: 13, cursor: fetchingUrl ? "wait" : "pointer", fontWeight: 500, minWidth: 100 }}>
              {fetchingUrl ? "⏳ 抓取中..." : "🔗 抓取"}
            </button>
          </div>
          {autoGenerating && <div style={{ marginTop: 8, fontSize: 13, color: "#3182ce", background: "#ebf8ff", borderRadius: 4, padding: "8px 12px", border: "1px solid #bee3f8" }}>⏳ {autoGenerating}</div>}
          {fetchStatus && !autoGenerating && <div style={{ marginTop: 8, fontSize: 13, borderRadius: 4, padding: "8px 12px", color: fetchStatus.includes("❌") ? "#e53e3e" : "#805ad5", background: fetchStatus.includes("❌") ? "#fff5f5" : "#f5f0ff", border: `1px solid ${fetchStatus.includes("❌") ? "#fed7d7" : "#e9d8fd"}` }}>{fetchStatus}</div>}
        </div>

        <div style={s.field}><label style={s.label}>参考内容</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="抓取的内容会自动出现" rows={4} style={s.textarea} /></div>
      </div>

      <div style={{ ...s.card, borderLeft: "4px solid #3182ce" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><span style={{ fontWeight: 600, fontSize: 15, color: "#3182ce" }}>生成标题</span><button onClick={() => generate("title")} disabled={titleLoading} style={s.gb(titleLoading, "#3182ce")}>{titleLoading ? "生成中..." : "生成"}</button></div>
        {titleError ? <div style={{ color: "#e53e3e", fontSize: 14, padding: 10 }}>{titleError}</div> : titleLines.length > 0 ? titleLines.map((line, i) => (
          <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: i === selectedTitle ? "2px solid #3182ce" : "1px solid #eee", borderRadius: 6, marginBottom: 6, cursor: "pointer", background: i === selectedTitle ? "#ebf8ff" : "#fafafa" }}>
            <input type="radio" name="t" checked={i === selectedTitle} onChange={() => setSelectedTitle(i)} style={{ accentColor: "#3182ce" }} /><span style={{ fontSize: 14, color: i === selectedTitle ? "#2b6cb0" : "#333" }}>{line}</span>
          </label>
        )) : titleLoading ? <div style={{ padding: 20, textAlign: "center", color: "#999" }}>生成中...</div> : <div style={{ padding: 20, textAlign: "center", color: "#ccc" }}>搜索后自动生成...</div>}
      </div>

      <div style={{ ...s.card, borderLeft: "4px solid #38a169" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#38a169" }}>生成摘要</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => generate("summary")} disabled={summaryLoading} style={s.gb(summaryLoading, "#38a169")}>{summaryLoading ? "生成中..." : "生成"}</button>
            {summaryResult && <><button onClick={() => publishArticle("summary", true)} disabled={publishing === "summary"} style={{ ...s.gb(false, "#d69e2e"), color: "#d69e2e", borderColor: "#d69e2e" }}>存草稿</button><button onClick={() => publishArticle("summary")} disabled={publishing === "summary"} style={{ ...s.gb(false, "#38a169"), background: "#38a169", color: "#fff" }}>发布</button></>}
          </div>
        </div>
        {summaryError ? <div style={{ color: "#e53e3e", fontSize: 14, padding: 10 }}>{summaryError}</div> : summaryResult ? <div style={s.rb}>{summaryResult}</div> : summaryLoading ? <div style={{ padding: 20, textAlign: "center", color: "#999" }}>生成中...</div> : <div style={{ padding: 20, textAlign: "center", color: "#ccc" }}>搜索后自动生成...</div>}
      </div>

      <div style={{ ...s.card, borderLeft: "4px solid #d69e2e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#d69e2e" }}>生成全文</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => generate("article")} disabled={articleLoading} style={s.gb(articleLoading, "#d69e2e")}>{articleLoading ? "生成中..." : "生成"}</button>
            {articleResult && <><button onClick={() => publishArticle("article", true)} disabled={publishing === "article"} style={{ ...s.gb(false, "#d69e2e"), color: "#d69e2e", borderColor: "#d69e2e" }}>存草稿</button><button onClick={() => publishArticle("article")} disabled={publishing === "article"} style={{ ...s.gb(false, "#38a169"), background: "#38a169", color: "#fff" }}>发布</button></>}
          </div>
        </div>
        {articleError ? <div style={{ color: "#e53e3e", fontSize: 14, padding: 10 }}>{articleError}</div> : articleResult ? <div style={s.rb} dangerouslySetInnerHTML={{ __html: articleResult }} /> : articleLoading ? <div style={{ padding: 20, textAlign: "center", color: "#999" }}>生成中...</div> : <div style={{ padding: 20, textAlign: "center", color: "#ccc" }}>搜索后自动生成...</div>}
      </div>
    </div>
  );
}

const s: Record<string, any> = {
  card: { background: "#fff", borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  title: { margin: 0, fontSize: 20, color: "#333" }, desc: { fontSize: 14, color: "#888", marginTop: 8 },
  field: { marginBottom: 14 }, label: { display: "block", fontSize: 13, color: "#555", fontWeight: 500, marginBottom: 6 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 4, fontSize: 14, boxSizing: "border-box" as const },
  select: { width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 4, fontSize: 14, background: "#fff", cursor: "pointer" as const },
  textarea: { width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: 4, fontSize: 14, resize: "vertical" as const, fontFamily: "inherit" },
  rb: { background: "#f9f9f9", borderRadius: 6, padding: 16, maxHeight: 400, overflow: "auto", fontSize: 14, lineHeight: 1.8 },
  gb: (l: boolean, c: string) => ({ padding: "7px 18px", border: `1px solid ${c}`, borderRadius: 6, background: l ? "#f0f0f0" : "#fff", color: l ? "#999" : c, fontSize: 13, cursor: l ? "wait" : "pointer" as const, fontWeight: 500 }),
};
