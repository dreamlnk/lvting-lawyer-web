import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "images");

export function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/** 是否外部图片 URL */
export function isExternalImageUrl(url: string): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (url.includes("/uploads/images/")) return false;
  return true;
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** 从 HTML 提取所有外部图片 URL */
export function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const imgRegex = /<img[^>]+src\s*=\s*["']?([^\s"'>]+)["']?/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const url = decodeHtmlEntities(match[1].trim());
    if (isExternalImageUrl(url)) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

const VALID_EXTS = new Set(["jpeg", "jpg", "png", "gif", "webp", "bmp"]);

/** 下载单个图片，返回本地路径 */
async function downloadSingleImage(url: string): Promise<{ original: string; local: string | null; error?: string }> {
  ensureDir();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    // 模拟真实浏览器请求，绕过防盗链
    const referer = (() => {
      try { return new URL(url).origin + "/"; } catch { return "https://example.com/"; }
    })();
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Referer": referer,
    };
    let response = await fetch(url, { signal: controller.signal, headers });
    // 如果 403 且没有 Origin 头，尝试带 Origin 重试
    if (response.status === 403) {
      headers["Origin"] = referer.slice(0, -1);
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 15000);
      response = await fetch(url, { signal: retryController.signal, headers });
      clearTimeout(retryTimeout);
    }
    clearTimeout(timeout);
    if (!response.ok) {
      return { original: url, local: null, error: `HTTP ${response.status}` };
    }
    const contentType = response.headers.get("content-type") || "";
    let ext = contentType.split("/").pop() || "jpg";
    const semiIdx = ext.indexOf(";");
    if (semiIdx > -1) ext = ext.substring(0, semiIdx);
    if (!VALID_EXTS.has(ext)) {
      const urlExt = path.extname(new URL(url).pathname).replace(".", "").toLowerCase();
      ext = VALID_EXTS.has(urlExt) ? urlExt : "jpg";
    }
    const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 10);
    const filename = `${Date.now()}_${hash}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return { original: url, local: `/uploads/images/${filename}` };
  } catch (err: any) {
    return { original: url, local: null, error: err?.message || "下载失败" };
  }
}

/** 清理 HTML 中的图片干扰：去掉 figure 包装、style 属性、data-* 属性 */
function cleanImageHtml(html: string): string {
  let c = html;
  c = c.replace(/\[Unsupported Image\]/gi, '');
  c = c.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '$1');
  c = c.replace(/<img\s+([^>]*?)>/gi, (_m: string, attrs: string) => {
    let cleaned = attrs;
    cleaned = cleaned.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\s*data-[a-z-]+(?:\s*=\s*["'][^"']*["'])?/gi, '');
    return `<img ${cleaned} style="display:block;margin:10px auto;max-width:100%;height:auto">`;
  });
  return c;
}

/** 传入 HTML，下载所有外部图片并清理图片 HTML，返回处理后的 HTML */
export async function downloadImagesInHtml(html: string): Promise<{ html: string; images: { original: string; local: string | null; error?: string }[] }> {
  const urls = extractImageUrls(html);
  const results: { original: string; local: string | null; error?: string }[] = [];
  if (urls.length > 0) {
    const concurrency = 5;
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(url => downloadSingleImage(url)));
      results.push(...batchResults);
    }
  }
  let modifiedHtml = html;
  for (const result of results) {
    if (result.local) {
      modifiedHtml = modifiedHtml.split(result.original).join(result.local);
      const encoded = result.original.replace(/&/g, "&amp;");
      if (encoded !== result.original) {
        modifiedHtml = modifiedHtml.split(encoded).join(result.local);
      }
    }
  }
  // 无论是否有外部图片，都清理图片 HTML
  modifiedHtml = cleanImageHtml(modifiedHtml);
  return { html: modifiedHtml, images: results };
}

/** 从 HTML 中提取所有本地图片文件名，用于删除时清理 */
export function extractLocalImageFilenames(html: string): string[] {
  const names: string[] = [];
  const regex = /\/uploads\/images\/([^"'\s)>]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    names.push(path.basename(match[1]));
  }
  return [...new Set(names)];
}
