import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // sql.js 使用 UMD 格式，与 webpack 冲突，需要排除打包
  serverExternalPackages: ['sql.js', 'mysql2'],
  async rewrites() {
    const dirs = [
      'xingshibianhu', 'hunyinjiating', 'jiaotongshigu',
      'laodonggongshang', 'fangchan', 'jingjihetong',
      'cx', 'shoufeibiaozhun', 'jj', 'e', 'd',
      'images', 'skin',
    ];
    const rewrites: { source: string; destination: string }[] = [];
    dirs.forEach((dir) => {
      // 目录首页
      rewrites.push({
        source: `/${dir}/`,
        destination: `/${dir}/index.html`,
      });
      // 具体文章页面
      rewrites.push({
        source: `/${dir}/:slug*`,
        destination: `/${dir}/:slug*`,
      });
    });
    return rewrites;
  },
};

export default nextConfig;
