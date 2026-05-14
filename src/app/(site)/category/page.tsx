import Link from 'next/link';
import { contact } from '@/lib/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '专业领域 - 刑事辩护、婚姻家庭、房产纠纷等',
  description: '吕婷律师专业领域涵盖刑事辩护、婚姻家庭、房产纠纷、工伤交通、公司劳务等，为您提供全方位的法律服务。',
  keywords: '刑事辩护,婚姻家庭,房产纠纷,工伤交通,公司劳务,法律服务',
};

// 模拟分类数据
const categories = [
  {
    id: 11,
    name: '刑事辩护',
    icon: '⚖️',
    description: '为犯罪嫌疑人、被告人提供专业的刑事辩护服务，维护当事人的合法权益。',
    articles: 356,
  },
  {
    id: 12,
    name: '婚姻家庭',
    icon: '👨‍👩‍👧‍👦',
    description: '处理离婚、抚养权、财产分割等各类婚姻家庭法律事务。',
    articles: 489,
  },
  {
    id: 15,
    name: '工伤交通',
    icon: '🚗',
    description: '为工伤职工和交通事故受害人提供专业的法律帮助。',
    articles: 278,
  },
  {
    id: 16,
    name: '房产纠纷',
    icon: '🏠',
    description: '解决房屋买卖、租赁、拆迁补偿等房产相关法律问题。',
    articles: 412,
  },
  {
    id: 8,
    name: '公司劳务',
    icon: '🏢',
    description: '处理劳动合同、劳动争议、公司法律事务等。',
    articles: 367,
  },
  {
    id: 17,
    name: '经济生活',
    icon: '💰',
    description: '处理借贷、合同、消费维权等经济生活中的法律问题。',
    articles: 523,
  },
  {
    id: 19,
    name: '法律程序',
    icon: '📋',
    description: '介绍各类法律程序和诉讼流程，帮助您了解法律途径。',
    articles: 237,
  },
];

export default function CategoriesPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">专业领域</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            吕婷律师在多个法律领域拥有丰富的实务经验，为您提供专业、高效的法律服务
          </p>
        </div>

        {/* 分类列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="group p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-900 hover:text-white"
            >
              <div className="flex items-start gap-6">
                <div className="text-5xl">{cat.icon}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-white">
                    {cat.name}
                  </h3>
                  <p className="text-gray-600 mb-4 group-hover:text-blue-200">
                    {cat.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 group-hover:text-blue-300">
                      {cat.articles} 篇文章
                    </span>
                    <span className="text-blue-900 font-semibold group-hover:text-yellow-400">
                      浏览文章 →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 咨询提示 */}
        <div className="mt-16 p-8 bg-blue-50 rounded-2xl text-center">
          <h3 className="text-2xl font-bold mb-4">有法律问题？</h3>
          <p className="text-gray-600 mb-6">
            吕婷律师提供免费初步咨询，欢迎来电或在线咨询
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              在线咨询
            </Link>
            <a href={`tel:${contact.phone}`} className="btn-secondary">
              📞 立即拨打
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
