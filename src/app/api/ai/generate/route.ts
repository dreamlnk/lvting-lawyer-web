import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";

const THEME_PROMPTS: Record<string, string> = {
  经典: "排版：经典风格。标题暖金色下划线，引用块浅黄背景+金左边框，提示暖色调。用style属性设颜色。",
  蓝色: "排版：蓝色风格。标题蓝色下划线，引用块浅蓝背景+蓝左边框，提示蓝色调。用style属性设颜色。",
  橙色: "排版：橙色风格。标题橙色下划线，引用块浅橙背景+橙左边框，提示橙色调。用style属性设颜色。",
  灰白: "排版：灰白风格。标题灰色下划线，引用块浅灰背景+灰左边框，提示灰白调。用style属性设颜色。",
};

const STYLE_PROMPTS: Record<string, string> = {
  原创写作: "你是有20年实务经验的苏州律师吕婷，现在写一篇普法文章。写作要求：1)像跟当事人面对面说话那样自然，用'我'、'我们'、'您'等人称，偶尔加一句个人办案经验或感受 2)句子长短错落，不要总是'首先其次最后'或'第一第二第三' 3)用设问开头或转折过渡，比如'你可能会问''有人会觉得''但实际情况是' 4)适当加入'说实话''坦白讲''实践中'等自然表达 5)段落长短不一，不要每段一样长 6)开头直接切入主题，不要'随着社会的发展'这种空话",
  改写: "你是苏州律师吕婷。用自己的话重写用户提供的内容。像跟朋友转述一个法律问题那样，保留核心观点但换一种说法，加入自己的理解和点评。不要逐句翻译原文，不要保留原文的句子结构。",
  仿写: "你是法律文案写手。仔细分析参考文章的行文风格、段落长短、语气特点，然后用同样的风格写一篇全新的文章。不要照搬参考文章的内容和案例。",
  追热点: "你是苏州律师吕婷。针对最近的热点事件从法律角度发表看法。开头用引人注意的话带出事件，然后分析法律问题，最后给读者实用建议。像跟朋友聊天，不要写成新闻稿。",
  问答式: "你是苏州律师吕婷。以聊天形式回答读者常见法律问题。问题贴近普通人真实困惑，回答简短直接，像在微信上回复咨询。每个问答2-4句话即可，不要太长。",
  案例评析: "你是苏州律师吕婷。跟读者分享一个法律案例。先像讲故事一样交代案件经过，然后点出争议焦点，接着分析法律怎么规定，最后说说启示。语气像执业多年的律师在跟同行交流。不要用'案情简介→争议焦点→'这类标题。",
  法规解读: "你是苏州律师吕婷。帮读者解读新的法律法规。先说说这条法规跟普通人有什么关系，再讲主要变化在哪里，最后给几条具体的应对建议。不要罗列法条。",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  title: "你是一个法律网站编辑。根据主题生成3个SEO友好的文章标题，每行一个，不要序号。",
  summary: "你是一个法律网站编辑。根据文章内容生成一段100-150字的文章摘要。直接返回摘要文本。",
  article: "",
};

export async function POST(req: NextRequest) {
  try {
    const { type = "article", style = "原创写作", theme = "经典", topic, content } = await req.json();
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "请在 .env 文件中配置 DEEPSEEK_API_KEY" }, { status: 500 });
    }
    if (!topic && !content) {
      return NextResponse.json({ error: "请输入主题或内容" }, { status: 400 });
    }

    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.article;

    if (type === "article") {
      const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS["原创写作"];
      const themePrompt = THEME_PROMPTS[theme] || THEME_PROMPTS["经典"];
      systemPrompt = stylePrompt + themePrompt + "直接输出文章HTML内容。不要出现'根据您提供的材料''作为专业文章''我将为您解析'等自我叙述。";
    }

    let userMessage = "";
    if (type === "article") {
      if (style === "改写" && content) userMessage = `请改写以下内容：\n\n${content}`;
      else if (style === "仿写" && content) userMessage = `请参考以下文章，写一篇关于"${topic}"的新文章：\n\n参考文章：\n${content}`;
      else if (style === "案例评析" && content) userMessage = `请根据以下案例写案例评析：\n\n${content}`;
      else userMessage = topic ? `主题：${topic}` : `内容：${content}`;
    } else if (type === "summary") {
      userMessage = content ? `请为以下文章写摘要：\n\n${content}` : `主题：${topic}`;
    } else if (type === "title") {
      userMessage = content ? `根据以下内容生成标题：\n\n${content}` : `主题：${topic}`;
    }

    const res = await fetch(DEEPSEEK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
        temperature: 0.8,
        max_tokens: type === "article" ? 4096 : 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[DeepSeek API error]", res.status, err);
      return NextResponse.json({ error: `AI 服务暂不可用 (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const result = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("[/api/ai/generate]", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
