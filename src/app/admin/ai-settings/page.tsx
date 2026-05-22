"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProviderItem {
  id: string;
  name: string;
  apiBase: string;
  models: string[];
}

interface ConfigItem {
  selectedModel: string;
  hasKey: boolean;
  keyPreview: string;
}

export default function AISettingsPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [activeProvider, setActiveProvider] = useState("");
  const [configs, setConfigs] = useState<Record<string, ConfigItem>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/check").then(r => { if (!r.ok) router.push("/admin/login"); });
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/models");
      const d = await res.json();
      setProviders(d.providers || []);
      setActiveProvider(d.activeProvider || "");
      setConfigs(d.configs || {});
      // 初始化模型选择
      const initModels: Record<string, string> = {};
      for (const [id, c] of Object.entries(d.configs || {}) as [string, ConfigItem][]) {
        initModels[id] = (c as ConfigItem).selectedModel || (d.providers || []).find((p: ProviderItem) => p.id === id)?.models[0] || "";
      }
      setModels(initModels);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async (providerId: string) => {
    setSaving(true);
    try {
      const cfg: any = {};
      if (models[providerId]) cfg.selectedModel = models[providerId];
      if (keys[providerId]) cfg.apiKey = keys[providerId];
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerConfigs: { [providerId]: cfg } }),
      });
      if (res.ok) {
        setKeys(prev => { const n = { ...prev }; delete n[providerId]; return n; });
        loadSettings();
      } else {
        const d = await res.json();
        alert(d.error || "保存失败");
      }
    } catch { alert("网络错误"); }
    finally { setSaving(false); }
  };

  const handleSetActive = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activeProvider: id }) });
      if (res.ok) { setActiveProvider(id); } else { alert("切换失败"); }
    } catch { alert("网络错误"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8, color: "#333" }}>AI 模型设置</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>配置大模型 API 密钥和模型选择，当前激活：<b style={{ color: "#333" }}>{providers.find(p => p.id === activeProvider)?.name || "未设置"}</b></p>

      {providers.map(p => {
        const cfg = configs[p.id];
        const isActive = activeProvider === p.id;
        return (
          <div key={p.id} style={{ background: "#fff", borderRadius: 8, padding: 20, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: isActive ? "2px solid #3182ce" : "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 15, color: "#333" }}>{p.name}</span>
                {isActive && <span style={{ fontSize: 11, marginLeft: 8, padding: "1px 6px", borderRadius: 4, background: "#e6f0ff", color: "#3182ce" }}>当前使用</span>}
                {cfg?.hasKey && !isActive && <span style={{ fontSize: 11, marginLeft: 8, padding: "1px 6px", borderRadius: 4, background: "#f0f0f0", color: "#666" }}>已配置</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!isActive && cfg?.hasKey && (
                  <button onClick={() => handleSetActive(p.id)} disabled={saving}
                    style={{ padding: "4px 12px", border: "1px solid #3182ce", borderRadius: 4, background: "#fff", color: "#3182ce", fontSize: 12, cursor: "pointer" }}>
                    启用
                  </button>
                )}
                {isActive && <span style={{ fontSize: 12, color: "#888", padding: "4px 0" }}>激活中</span>}
              </div>
            </div>

            {/* API Key */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "#555", width: 60, flexShrink: 0, fontWeight: 500 }}>API Key</label>
              <input
                type="password"
                value={keys[p.id] ?? ""}
                onChange={e => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                placeholder={cfg?.keyPreview || "输入 API Key"}
                style={{ flex: 1, padding: "7px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}
              />
            </div>

            {/* API Base */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "#555", width: 60, flexShrink: 0, fontWeight: 500 }}>API 地址</label>
              <input
                value={p.apiBase}
                readOnly
                style={{ flex: 1, padding: "7px 10px", border: "1px solid #eee", borderRadius: 4, fontSize: 12, color: "#888", background: "#f9f9f9" }}
              />
            </div>

            {/* Model */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 13, color: "#555", width: 60, flexShrink: 0, fontWeight: 500 }}>模型</label>
              {p.models.length > 0 ? (
                <select
                  value={models[p.id] || ""}
                  onChange={e => setModels(prev => ({ ...prev, [p.id]: e.target.value }))}
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13, background: "#fff" }}
                >
                  {p.models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input
                  value={models[p.id] || ""}
                  onChange={e => setModels(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder="输入模型名"
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13 }}
                />
              )}
              <button onClick={() => handleSave(p.id)} disabled={saving}
                style={{ padding: "7px 16px", background: saving ? "#ccc" : "#38a169", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, cursor: saving ? "wait" : "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                {saving ? "保存中" : "保存"}
              </button>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 12, color: "#aaa", marginTop: 12, lineHeight: 1.6 }}>
        密钥保存在服务器 <code>data/model-settings.json</code> 文件中，不会暴露到前端。支持所有兼容 OpenAI Chat Completions 接口的大模型。
      </div>
    </div>
  );
}
