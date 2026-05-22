import { NextRequest, NextResponse } from "next/server";
import { getModelConfig } from "@/lib/model-config";

const THEME_PROMPTS: Record<string, string> = {
  经典: "排版：经典风格。标题暖金色下划线，引用块浅黄背景+金左边框，提示暖色调。用style属性设颜色。",
  蓝色: "排版：蓝色风格。标题蓝色下划线，引用块浅蓝背景+蓝左边框，提示蓝色调。用style属性设颜色。",
  橙色: "排版：橙色风格。标题橙色下划线，引用块浅橙背景+橙左边框，提示橙色调。用style属性设颜色。",
  灰白: "排版：灰白风格。标题灰色下划线，引用块浅灰背景+灰左边框，提示灰白调。用style属性设颜色。",
};

const STYLE_PROMPTS: Record<string, string> = {
  原创写作: "你是有10多年实务经验的苏州律师吕婷，现在写一篇普法文章。写作要求：1)像跟当事人面对面聊天，用'我''我们''你'，不用'您'。法律行业日常不称'您'，这是通俗普法不是客服 2)开头直接说事，不要设问开头，不要'你可能会问' 3)句子长短错落，段落长短不一，不要'首先其次最后''第一第二第三'这类词 4)结尾自然收束，不要'你看，法律很人性化''总而言之'这类感叹总结，不要编号建议清单 5)法律分析引用具体法条（如《刑法》第X条），不要含糊说'相关法律规定' 6)不要用括号解释常识术语（如'安乐死（对动物实施……）'） 7)全文不超过一处'坦白讲''说实话'，不要刻意模仿口语",
  改写: "你是苏州律师吕婷。用自己的话重写用户提供的内容。像跟朋友转述一个法律问题那样，保留核心观点但换一种说法，加入自己的理解和点评。不要逐句翻译原文，不要保留原文的句子结构。不要编号清单结尾，不要'总而言之'。",
  仿写: "你是法律文案写手。仔细分析参考文章的行文风格、段落长短、语气特点，然后用同样的风格写一篇全新的文章。不要照搬参考文章的内容和案例。",
  追热点: "你是苏州律师吕婷。针对热点事件从法律角度发表看法。开头直接说事，不要'近日，XX事件引发广泛关注'这类新闻导语。分析法律问题时引用具体法条。像跟朋友聊天的语气，不要结尾用编号清单给建议，不要'总而言之''综上所述'。",
  问答式: "你是苏州律师吕婷。以聊天形式回答读者常见法律问题。问题贴近普通人真实困惑，回答简短直接，像在微信上回复咨询。每个问答2-4句话即可，不要太长。",
  案例评析: "你是苏州律师吕婷。跟读者分享一个法律案例。像讲故事一样交代案件经过，带出具体细节（法院名称、判决文号、当事人态度、庭审对话），然后自然过渡到法律分析，引用具体法条。语气像执业多年的律师跟同行聊天。称读者用'你'不用'您'。不要用'案情简介→争议焦点→启示'这种标题，不要编号清单，不要设问开头。",
  法规解读: "你是苏州律师吕婷。帮读者解读新的法律法规。直接用具体场景说明这条法规跟普通人的关系（如'假如你……'），别用'随着XX的出台'开头。讲变化时引用新旧条文对比，给建议时自然融入文中，不要结尾甩一个编号清单。不要罗列法条。",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  title: "你是一个法律网站编辑。根据主题生成3个文章标题，每行一个，不要序号。要求：1)有吸引力——用具体细节、冲突感、悬念或情感钩子抓住读者，但不用标题党手法 2)口语化，像朋友聊天随口说的话 3)不要'你必须知道的X个''X大方法''一文读懂'这类模板句式 4)不用冒号分隔的复合标题 5)15-25个字。",
  summary: "你是一个法律网站编辑。根据文章内容生成一段100-150字的文章摘要。直接返回摘要文本。",
  article: "",
};

export async function POST(req: NextRequest) {
  try {
    const { type = "article", style = "原创写作", theme = "经典", topic, content, model } = await req.json();
    const cfg = getModelConfig(model as string | undefined);

    if (!cfg) {
      return NextResponse.json({ error: "请在左侧 AI 设置中配置大模型和密钥" }, { status: 500 });
    }
    if (!topic && !content) {
      return NextResponse.json({ error: "请输入主题或内容" }, { status: 400 });
    }

    let systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.article;

    if (type === "article") {
      const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS["原创写作"];
      const themePrompt = THEME_PROMPTS[theme] || THEME_PROMPTS["经典"];
      systemPrompt = stylePrompt + themePrompt + "文章开头必须先用h2标签写一句总结性标题，再开始正文。只输出文章正文HTML片段（用p、h2、h3、blockquote、ul、ol、li、strong、em等标签），不要输出<!DOCTYPE>、html、head、body标签，不要输出整页HTML。全文统一用'你'不用'您'。不要出现'根据您提供的材料''作为专业文章''我将为您解析'等自我叙述。";
    }

    let userMessage = "";
    if (type === "article") {
      if (style === "改写" && content) userMessage = `请改写以下内容：\n\n${content}`;
      else if (style === "仿写" && content) userMessage = `请参考以下文章，写一篇关于"${topic}"的新文章：\n\n参考文章：\n${content}`;
      else if (style === "案例评析" && content) userMessage = `请根据以下案例写案例评析：\n\n${content}`;
      else userMessage = content ? `请基于以下参考材料写一篇普法文章，严格保持事实准确，不要编造细节、金额、人名、地名、日期、判决结果：\n\n${content}` : `主题：${topic}`;
    } else if (type === "summary") {
      userMessage = content ? `请为以下文章写摘要：\n\n${content}` : `主题：${topic}`;
    } else if (type === "title") {
      userMessage = content ? `根据以下内容生成标题：\n\n${content}` : `主题：${topic}`;
    }

    const res = await fetch(cfg.apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
        temperature: 0.8,
        max_tokens: type === "article" ? 4096 : 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[${cfg.provider} API error]`, res.status, err);
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
