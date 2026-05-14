import { getCategories, initSchema } from "@/lib/db";

async function test() {
  console.log("1. 初始化 schema...");
  await initSchema();
  console.log("2. 查询栏目...");
  const cats = await getCategories();
  console.log("栏目数:", cats.length);
  console.log(cats);
}

test().catch(console.error);
