import fs from "fs";
import path from "path";

interface ModelConfig {
  apiKey: string;
  apiBase: string;
  model: string;
  provider: string;
}

const SETTINGS_FILE = path.join(process.cwd(), "data", "model-settings.json");

const DEFAULT_PROVIDERS: Record<string, { apiBase: string; models: string[] }> = {
  deepseek: { apiBase: "https://api.deepseek.com/v1/chat/completions", models: ["deepseek-chat"] },
  openai: { apiBase: "https://api.openai.com/v1/chat/completions", models: ["gpt-4o-mini"] },
  moonshot: { apiBase: "https://api.moonshot.cn/v1/chat/completions", models: ["moonshot-v1-8k"] },
  zhipu: { apiBase: "https://open.bigmodel.cn/api/paas/v4/chat/completions", models: ["glm-4-flash"] },
  qwen: { apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", models: ["qwen-plus"] },
};

export function getModelConfig(modelOverride?: string): ModelConfig | null {
  // modelOverride 格式: "providerId/modelName"，如 "deepseek/deepseek-v4-pro"
  let targetProvider: string | null = null;
  let targetModel: string | null = null;
  if (modelOverride?.includes("/")) {
    const [pid, ...rest] = modelOverride.split("/");
    targetProvider = pid;
    targetModel = rest.join("/");
  }

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      const provider = targetProvider || settings.activeProvider || "deepseek";
      const cfg = settings.providerConfigs?.[provider];
      if (cfg?.apiKey) {
        const def = DEFAULT_PROVIDERS[provider] || { apiBase: "", models: [""] };
        return {
          apiKey: cfg.apiKey,
          apiBase: settings.providers?.find((p: any) => p.id === provider)?.apiBase || def.apiBase,
          model: targetModel || cfg.selectedModel || def.models[0],
          provider,
        };
      }
    }
  } catch {}

  // 兜底：用 .env 中的 DEEPSEEK_API_KEY（仅当未指定其他模型时）
  if (!targetProvider && process.env.DEEPSEEK_API_KEY) {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY,
      apiBase: "https://api.deepseek.com/v1/chat/completions",
      model: targetModel || "deepseek-chat",
      provider: "deepseek",
    };
  }

  return null;
}
