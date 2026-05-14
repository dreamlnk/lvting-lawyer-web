import { createArticle } from '@/lib/db';

const content = `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
  <img src="/images/fengcai/微信图片_2026-05-06_203942_555.jpg" alt="律师风采1" style="width:100%;border-radius:8px;" />
  <img src="/images/fengcai/微信图片_2026-05-06_204016_822.jpg" alt="律师风采2" style="width:100%;border-radius:8px;" />
  <img src="/images/fengcai/微信图片_2026-05-06_204039_108.jpg" alt="律师风采3" style="width:100%;border-radius:8px;" />
  <img src="/images/fengcai/微信图片_2026-05-06_204050_434.jpg" alt="律师风采4" style="width:100%;border-radius:8px;" />
</div>
`;

async function main() {
  const id = await createArticle({
    title: '律师风采',
    content,
    summary: '吕婷律师工作风采展示',
    categoryId: 9,
    status: 'published',
  });
  console.log('创建成功，文章ID：', id);
}

main();
