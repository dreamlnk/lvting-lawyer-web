"use client";
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ============ 3D 图形绘制 ============ */

interface Shape {
  type: string;       // 圆柱 | 圆锥 | 长方体 | 三角体
  size: string;       // 小 | 中 | 大
  cx: number;         // 中心 x
  cy: number;         // 中心 y
  w: number;          // 宽度
  h: number;          // 高度
  color: string;
}

const COLORS = ["#3182ce","#e53e3e","#38a169","#d69e2e","#805ad5","#dd6b20","#00b5d8","#e53e3e"];
const SIZE_MAP: Record<string, number> = { "小": 36, "中": 52, "大": 68 };

function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.save();
  const cx = s.cx, cy = s.cy, w = s.w, h = s.h, c = s.color;

  switch (s.type) {
    case "圆柱体": {
      // 顶面椭圆
      ctx.beginPath();
      ctx.ellipse(cx, cy - h * 0.25, w * 0.5, w * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 底面椭圆
      ctx.beginPath();
      ctx.ellipse(cx, cy + h * 0.25, w * 0.5, w * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = c + "80";
      ctx.fill();
      ctx.stroke();
      // 两侧线
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.5, cy - h * 0.25);
      ctx.lineTo(cx - w * 0.5, cy + h * 0.25);
      ctx.moveTo(cx + w * 0.5, cy - h * 0.25);
      ctx.lineTo(cx + w * 0.5, cy + h * 0.25);
      ctx.stroke();
      break;
    }
    case "圆锥体": {
      // 底面椭圆
      ctx.beginPath();
      ctx.ellipse(cx, cy + h * 0.2, w * 0.5, w * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = c + "80";
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 三角形连接顶点
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.5, cy + h * 0.2);
      ctx.lineTo(cx, cy - h * 0.4);
      ctx.lineTo(cx + w * 0.5, cy + h * 0.2);
      ctx.closePath();
      ctx.fillStyle = c + "c0";
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "长方体": {
      const hw = w * 0.5, hh = h * 0.5, dep = w * 0.25;
      // 前面
      ctx.fillStyle = c + "c0";
      ctx.fillRect(cx - hw, cy - hh, w, h);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - hw, cy - hh, w, h);
      // 顶面
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy - hh);
      ctx.lineTo(cx - hw + dep, cy - hh - dep);
      ctx.lineTo(cx + hw + dep, cy - hh - dep);
      ctx.lineTo(cx + hw, cy - hh);
      ctx.closePath();
      ctx.fillStyle = c;
      ctx.fill();
      ctx.stroke();
      // 右面
      ctx.beginPath();
      ctx.moveTo(cx + hw, cy - hh);
      ctx.lineTo(cx + hw + dep, cy - hh - dep);
      ctx.lineTo(cx + hw + dep, cy + hh - dep);
      ctx.lineTo(cx + hw, cy + hh);
      ctx.closePath();
      ctx.fillStyle = c + "80";
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "三角体": {
      const hw = w * 0.5, hh = h * 0.5, dep = w * 0.25;
      // 前面三角形
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx - hw, cy + hh);
      ctx.lineTo(cx + hw, cy + hh);
      ctx.closePath();
      ctx.fillStyle = c + "c0";
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 顶面
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx + dep, cy - hh - dep);
      ctx.lineTo(cx + hw + dep, cy + hh - dep);
      ctx.lineTo(cx + hw, cy + hh);
      ctx.closePath();
      ctx.fillStyle = c + "80";
      ctx.fill();
      ctx.stroke();
      // 右面
      ctx.beginPath();
      ctx.moveTo(cx - hw, cy + hh);
      ctx.lineTo(cx + hw, cy + hh);
      ctx.lineTo(cx + hw + dep, cy + hh - dep);
      ctx.lineTo(cx - hw + dep, cy + hh - dep);
      ctx.closePath();
      ctx.fillStyle = c + "60";
      ctx.fill();
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/* ============ 验证码生成 ============ */

type Size = "小" | "中" | "大";
type Type = "圆柱体" | "圆锥体" | "长方体" | "三角体";
const TYPES: Type[] = ["圆柱体", "圆锥体", "长方体", "三角体"];
const SIZES: Size[] = ["小", "中", "大"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateShapes(): { shapes: Shape[]; target: Shape; prompt: string } {
  // 生成 6 个图形：每种类型至少一个，总大小中
  const shapes: Shape[] = [];
  const used = new Set<string>();
  const canvasW = 340, canvasH = 200;
  const padding = 10;

  // 保证每种类型至少有一个
  for (const type of TYPES) {
    const size = SIZES[Math.floor(Math.random() * 3)];
    shapes.push({ type, size, cx: 0, cy: 0, w: 0, h: 0, color: COLORS[shapes.length % COLORS.length] });
  }

  // 再随机加 2 个
  for (let i = 0; i < 2; i++) {
    const type = TYPES[Math.floor(Math.random() * 4)];
    const size = SIZES[Math.floor(Math.random() * 3)];
    shapes.push({ type, size, cx: 0, cy: 0, w: 0, h: 0, color: COLORS[shapes.length % COLORS.length] });
  }

  // 打乱
  const shuffled = shuffle(shapes);

  // 布局：2 行 x 3 列
  const cols = 3;
  const spacingX = (canvasW - padding * 2) / cols;
  const spacingY = (canvasH - padding * 2) / 2;

  for (let i = 0; i < shuffled.length; i++) {
    const s = shuffled[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sizeVal = SIZE_MAP[s.size];
    s.w = sizeVal;
    s.h = sizeVal * 1.2;
    s.cx = padding + spacingX * col + spacingX / 2;
    s.cy = padding + spacingY * row + spacingY / 2;
  }

  // 随机选一个作为目标
  const targetIdx = Math.floor(Math.random() * shuffled.length);
  const target = shuffled[targetIdx];
  const prompt = `请点击图中的${target.size}${target.type}`;

  return { shapes: shuffled, target, prompt };
}

function isClickOnShape(mx: number, my: number, s: Shape): boolean {
  const halfW = s.w * 0.55; // 稍宽松的命中区域
  const halfH = s.h * 0.5;
  return mx >= s.cx - halfW && mx <= s.cx + halfW &&
         my >= s.cy - halfH && my <= s.cy + halfH;
}

/* ============ 页面组件 ============ */

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaData, setCaptchaData] = useState<{ shapes: Shape[]; target: Shape; prompt: string } | null>(null);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const generate = useCallback(() => {
    const data = generateShapes();
    setCaptchaData(data);
    setCaptchaPassed(false);
    setShowCaptcha(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 340;
    canvas.height = 200;
    ctx.clearRect(0, 0, 340, 200);

    // 背景
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, 340, 200);

    // 网格线
    ctx.strokeStyle = "#e8e8e8";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 100);
      ctx.lineTo(340, i * 100);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 113, 0);
      ctx.lineTo(i * 113, 200);
      ctx.stroke();
    }

    // 绘制图形
    data.shapes.forEach(s => drawShape(ctx, s));

    // 图形编号（调试辅助）
    data.shapes.forEach((s, i) => {
      ctx.fillStyle = "#999";
      ctx.font = "10px sans-serif";
      ctx.fillText(String(i + 1), s.cx - s.w * 0.5, s.cy + s.h * 0.5 + 14);
    });
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (captchaPassed || !captchaData) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // scale
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const cmx = mx * scaleX;
    const cmy = my * scaleY;

    const target = captchaData.target;
    if (isClickOnShape(cmx, cmy, target)) {
      setCaptchaPassed(true);
      setError("");
    } else {
      setError("请点击正确的图形");
      generate();
    }
  };

  useEffect(() => { generate(); }, [generate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaPassed) {
      setError("请先通过图形验证");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "登录失败");
        generate();
      }
    } catch {
      setError("网络错误");
      generate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>吕婷律师</h1>
        <div style={styles.path}>管理后台</div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>用户名</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
          </div>

          {/* 图形点击验证 */}
          {showCaptcha && captchaData && (
            <div style={styles.captchaWrap}>
              <div style={styles.captchaPrompt}>{captchaData.prompt}</div>
              <canvas
                ref={canvasRef}
                width={340}
                height={200}
                onClick={handleCanvasClick}
                style={{
                  width: "100%", maxWidth: 340, height: "auto", aspectRatio: "340/200",
                  borderRadius: 6, cursor: "pointer", border: captchaPassed ? "2px solid #48bb78" : "1px solid #ddd",
                  display: "block", margin: "0 auto",
                }}
              />
              {captchaPassed && (
                <div style={{ textAlign: "center", color: "#48bb78", fontSize: 14, marginTop: 6, fontWeight: 500 }}>
                  ✓ 验证通过
                </div>
              )}
              <button type="button" onClick={generate} style={styles.refreshBtn}>换一组图形</button>
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button} disabled={loading || !captchaPassed}>
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" },
  card: { background: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "100%", maxWidth: "420px" },
  title: { textAlign: "center", marginBottom: "10px", color: "#333", fontSize: "24px" },
  path: { textAlign: "center", fontSize: "12px", color: "#999", marginBottom: "30px", fontFamily: "monospace" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", color: "#666", fontWeight: 500 },
  input: { padding: "12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const, width: "100%" },
  captchaWrap: { border: "1px solid #eee", borderRadius: "8px", padding: "12px", background: "#fafafa" },
  captchaPrompt: { textAlign: "center", fontSize: "14px", color: "#333", fontWeight: 500, marginBottom: 10 },
  refreshBtn: { display: "block", margin: "8px auto 0", padding: "6px 14px", border: "1px solid #3182ce", borderRadius: "4px", background: "#fff", color: "#3182ce", fontSize: "12px", cursor: "pointer" },
  error: { color: "#e53e3e", fontSize: "14px", textAlign: "center" as const },
  button: { padding: "12px", background: "#3182ce", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: 500 },
};
