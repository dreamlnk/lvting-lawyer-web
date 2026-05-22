import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "model-settings.json");

interface Provider {
  id: string;
  name: string;
  apiBase: string;
  models: string[];
}

interface Settings {
  providers: Provider[];
  activeProvider: string;
  providerConfigs: Record<string, { apiKey: string; selectedModel: string }>;
}

const DEFAULT_PROVIDERS: Provider[] = [
  { id: "deepseek", name: "DeepSeek", apiBase: "https://api.deepseek.com/v1/chat/completions", models: ["deepseek-v4-pro", "deepseek-v4-flash"] },
  { id: "openai", name: "OpenAI", apiBase: "https://api.openai.com/v1/chat/completions", models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1"] },
  { id: "moonshot", name: "Moonshot（月之暗面）", apiBase: "https://api.moonshot.cn/v1/chat/completions", models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"] },
  { id: "zhipu", name: "智谱 GLM", apiBase: "https://open.bigmodel.cn/api/paas/v4/chat/completions", models: ["glm-4", "glm-4-flash"] },
  { id: "qwen", name: "通义千问", apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", models: ["qwen-turbo", "qwen-plus", "qwen-max"] },
  { id: "custom", name: "自定义（OpenAI兼容）", apiBase: "", models: [] },
];

function loadSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch { }
  return { providers: DEFAULT_PROVIDERS, activeProvider: "deepseek", providerConfigs: {} };
}

export async function GET() {
  const settings = loadSettings();
  // 回传时脱敏密钥
  const safeConfigs: Record<string, any> = {};
  for (const [id, cfg] of Object.entries(settings.providerConfigs || {})) {
    safeConfigs[id] = {
      selectedModel: cfg.selectedModel || (DEFAULT_PROVIDERS.find(p => p.id === id)?.models[0] || ""),
      hasKey: !!cfg.apiKey,
      keyPreview: cfg.apiKey ? cfg.apiKey.substring(0, 6) + "***" + cfg.apiKey.substring(cfg.apiKey.length - 4) : "",
    };
  }
  return NextResponse.json({
    providers: settings.providers,
    activeProvider: settings.activeProvider,
    configs: safeConfigs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = loadSettings();

    if (body.activeProvider) {
      settings.activeProvider = body.activeProvider;
    }
    if (body.providerConfigs) {
      settings.providerConfigs = { ...settings.providerConfigs, ...body.providerConfigs };
    }
    if (body.providers) {
      settings.providers = body.providers;
    }

    // 确保目录存在
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "保存失败" }, { status: 500 });
  }
}
