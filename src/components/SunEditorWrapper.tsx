"use client";

import { useEffect, useRef, useState } from "react";

// 通过 API 路由加载 SunEditor CSS（避免全局 JS import 污染页面样式）
const EDITOR_CSS_HREF = "/api/css/suneditor";

/** 自动排版 - 清理和格式化 HTML */
function formatHtml(html: string): string {
  if (!html) return html;
  let c = html;
  c = c.replace(/\[Unsupported Image\]/gi, '');
  c = c.replace(/[​‌‍﻿　]/g, '');
  c = c.replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>');
  c = c.replace(/<br\s*\/?>/gi, '</p><p>');
  c = c.replace(/(^|<\/[^>]+>)\s*([^<>\n]+)\s*(?=<|$)/g, (_m: string, before: string, text: string) => {
    const t = text.trim();
    if (!t) return before;
    return before + '<p>' + t + '</p>';
  });
  c = c.replace(/<p>\s*(?:<br\s*\/?>\s*)?<\/p>/gi, '');
  c = c.replace(/<(div|span|strong|em|b|i|u|h[1-6])\s*><\/\1>/gi, '');
  // 去掉 img 标签上所有干扰属性：style、data-*属性、（还可能包裹它的 figure）
  c = c.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '$1');
  c = c.replace(/<img\s+([^>]*?)>/gi, (_m: string, attrs: string) => {
    let cleaned = attrs;
    // 去掉 style 属性
    cleaned = cleaned.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
    // 去掉 data- 属性
    cleaned = cleaned.replace(/\s*data-[a-z-]+(?:\s*=\s*["'][^"']*["'])?/gi, '');
    // 添加居中样式（只在 img 没有 class 或 style 时）
    return `<img ${cleaned} style="display:block;margin:10px auto;max-width:100%;height:auto">`;
  });
  c = c.replace(/<\/p>\s*<p>/g, '</p>\n<p>');
  return c.trim();
}

interface Props {
  value: string;
  onEditorChange: (content: string) => void;
  articleTitle?: string;
}

export default function SunEditorWrapper({ value, onEditorChange }: Props) {
  const editorRef = useRef<any>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const valueRef = useRef(value);
  const onChangeRef = useRef(onEditorChange);
  onChangeRef.current = onEditorChange;

  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    if (!divRef.current) return;
    let destroyed = false;

    try {
      import("suneditor").then(mod => {
        if (destroyed || !divRef.current) return;
        const SUN = mod.default || mod;
        const neededPlugins: Record<string, any> = {};
        if (mod.plugins) {
          const keys = ["font", "fontColor", "fontSize", "align", "list", "table", "link", "image", "video"];
          keys.forEach(key => {
            const p = (mod.plugins as any)[key];
            if (p) neededPlugins[key] = p;
          });
        }
        const editor = SUN.create(divRef.current, {
          plugins: neededPlugins,
          height: 520,
          minHeight: 400,
          maxHeight: 700,
          value: value || "",
          buttonList: [
            ["undo", "redo"],
            ["bold", "underline", "italic", "strike"],
            ["font", "fontSize", "fontColor"],
            ["align", "list", "table", "link", "image", "video"],
            ["fullScreen", "codeView"],
          ],
        });
        editorRef.current = editor;
        setReady(true);
      }).catch((e) => {
        console.error("[SunEditor] load err:", e);
        setError("编辑器加载失败");
        setReady(true);
      });
    } catch (e) {
      console.error("[SunEditor] init err:", e);
      setError("编辑器初始化失败");
      setReady(true);
    }

    return () => {
      destroyed = true;
      if (editorRef.current) {
        try { editorRef.current.destroy(); } catch {}
        editorRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 外部 value 变化时写入编辑器
  useEffect(() => {
    if (!ready || error) return;
    const frame = editorRef.current?.$?.frameContext;
    if (!frame) return;
    const wysiwyg = frame.get("wysiwyg");
    if (!wysiwyg) return;
    const current = wysiwyg.innerHTML || "";
    const html = value || "";
    if (html.trim() !== current.trim()) {
      wysiwyg.innerHTML = html;
    }
  }, [value, ready, error]);

  // 轮询检测编辑器内容变化
  useEffect(() => {
    if (!ready || error) return;
    const timer = setInterval(() => {
      const frame = editorRef.current?.$?.frameContext;
      if (!frame) return;
      const wysiwyg = frame.get("wysiwyg");
      if (!wysiwyg) return;
      const c = wysiwyg.innerHTML || "";
      if (c !== valueRef.current) {
        valueRef.current = c;
        onChangeRef.current(c);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [ready, error]);

  /** 自动排版 */
  const handleFormat = () => {
    try {
      const frame = editorRef.current?.$?.frameContext;
      if (!frame) return;
      const wysiwyg = frame.get("wysiwyg");
      if (!wysiwyg) return;
      const html = wysiwyg.innerHTML || "";
      const formatted = formatHtml(html);
      wysiwyg.innerHTML = formatted;
      valueRef.current = formatted;
      onChangeRef.current(formatted);
    } catch (e) {
      console.error("[SunEditor] format: error", e);
    }
  };

  // 在 iframe 的 capture 阶段拦截粘贴，抢在 SunEditor 之前清理图片
  useEffect(() => {
    if (!ready || error || !divRef.current) return;

    const findIframe = () => {
      const iframe = divRef.current?.querySelector('iframe.se-frame') as HTMLIFrameElement | null;
      if (!iframe) { setTimeout(findIframe, 500); return; }
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) { iframe.addEventListener('load', findIframe, { once: true }); return; }

      doc.addEventListener('paste', (e: Event) => {
        const ce = e as ClipboardEvent;
        const data = ce.clipboardData;
        if (!data) return;
        const html = data.getData('text/html');
        if (!html) return;

        // 检查是否有需要清理的图片
        const hasImg = /<img[\s>]/i.test(html);
        const hasSe = /se-component/i.test(html);
        if (!hasImg && !hasSe) return;

        // 拦截粘贴，清理后再插入
        e.preventDefault();
        e.stopPropagation();

        let cleaned = html;
        // 去 figure 包装
        cleaned = cleaned.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '$1');
        // 去 img 的 style 和 data-* 属性
        cleaned = cleaned.replace(/<img\s+([^>]*?)>/gi, (_m: string, attrs: string) => {
          let a = attrs;
          a = a.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
          a = a.replace(/\s*data-[a-z-]+(?:\s*=\s*["'][^"']*["'])?/gi, '');
          // 去掉 se-component 容器
          return `<img ${a}>`;
        });
        // 去 se-component 容器（如果有剩下的）
        cleaned = cleaned.replace(/<div[^>]*class="[^"]*\bse-component\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '$1');

        // 通过焦点插入清理后的 HTML（触发 SunEditor 自身处理，但图片已是干净的）
        const frame = editorRef.current?.$?.frameContext;
        if (!frame) return;
        const wysiwyg = frame.get("wysiwyg");
        if (!wysiwyg) return;
        wysiwyg.focus();
        const iframeWin = iframe.contentWindow;
        if (iframeWin) {
          iframeWin.document.execCommand('insertHTML', false, cleaned);
        }

        // 同步内容
        const newContent = wysiwyg.innerHTML || "";
        valueRef.current = newContent;
        onChangeRef.current(newContent);
      }, { capture: true });
    };
    findIframe();
  }, [ready, error]);

  // 加载 SunEditor CSS，并覆盖图片最大宽度限制（保持原始大小）
  useEffect(() => {
    if (!document.querySelector(`link[href="${EDITOR_CSS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = EDITOR_CSS_HREF;
      document.head.appendChild(link);
    }
    if (!document.querySelector('[data-id="se-img-override"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-id", "se-img-override");
      style.textContent = `
        .sun-editor .se-wrapper img,
        .sun-editor-editable img { max-width:none!important; min-width:0!important; height:auto!important; }
        .se-image-container, .se-component { float:none!important; display:block!important; margin:10px 0!important; }
        .se-image-container figure, .se-component figure { height:auto!important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div>
      {!ready && (
        <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
          富文本编辑器加载中，请稍候...
        </div>
      )}
      {ready && (
        <div style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleFormat}
            style={{
              padding: "6px 14px",
              border: "1px solid #3182ce",
              borderRadius: 4,
              background: "#fff",
              color: "#3182ce",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            📐 自动排版
          </button>
          {error && <span style={{ color: "#e53e3e", fontSize: 13, padding: "6px 0" }}>{error}</span>}
        </div>
      )}
      <div ref={divRef} style={{ opacity: ready ? 1 : 0, height: ready ? "auto" : 0, overflow: "hidden" }} />
    </div>
  );
}
