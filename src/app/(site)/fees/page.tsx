import { contact } from '@/lib/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '律师收费标准 - 透明合理的法律服务费用',
  description: '了解吕婷律师的收费标准。收费透明、合理、公正，包括咨询费、代理费、诉讼费等各类费用说明。',
  keywords: '律师收费,法律服务费用,诉讼费,代理费,苏州律师收费',
};

async function getPageContent(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost';
    const res = await fetch(`${baseUrl}/api/site/pages/fees`, { cache: 'no-store' });
    if (!res.ok) return '';
    const data = await res.json();
    return data.content || '';
  } catch {
    return '';
  }
}

export default async function FeesPage() {
  const content = await getPageContent();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">收费标准</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            透明、合理、公正的收费标准，让您明明白白消费
          </p>
        </div>

        {content ? (
          <div className="prose prose-lg max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <>
            {/* 收费说明 */}
            <section className="mb-16">
              <div className="bg-blue-50 border-l-4 border-blue-900 p-6 rounded-r-lg">
                <h2 className="text-2xl font-bold mb-4">收费原则</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span>严格按照《江苏省律师服务收费标准》执行</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span>收费透明，所有费用提前告知</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span>根据案件复杂程度和标的额合理定价</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">✓</span>
                    <span>签订委托合同后开具正规发票</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 收费方式 */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8">收费方式</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-bold mb-3">按件收费</h3>
                  <p className="text-gray-600 mb-4">适用于简单的法律事务，如法律咨询、文书代写等</p>
                  <p className="text-3xl font-bold text-blue-900">500-3000元</p>
                  <p className="text-sm text-gray-500 mt-1">每件</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-bold mb-3">按标的额收费</h3>
                  <p className="text-gray-600 mb-4">适用于经济合同纠纷、债权债务等涉及财产的案件</p>
                  <p className="text-3xl font-bold text-blue-900">3%-8%</p>
                  <p className="text-sm text-gray-500 mt-1">标的额比例</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-bold mb-3">计时收费</h3>
                  <p className="text-gray-600 mb-4">适用于需要长期陪伴的法律顾问服务</p>
                  <p className="text-3xl font-bold text-blue-900">200-3000元</p>
                  <p className="text-sm text-gray-500 mt-1">每小时</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-bold mb-3">风险代理</h3>
                  <p className="text-gray-600 mb-4">根据案件结果付费，未达预期目标不收或减收代理费</p>
                  <p className="text-3xl font-bold text-blue-900">10%-30%</p>
                  <p className="text-sm text-gray-500 mt-1">标的额比例</p>
                </div>
              </div>
            </section>

            {/* 联系方式 */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8">联系我</h2>
              <div className="bg-gray-50 p-8 rounded-xl">
                <p className="text-lg mb-6">
                  如果您有任何法律问题需要咨询，欢迎随时联系我
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <span className="text-gray-700">{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <span className="text-gray-700">微信：{contact.wechat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <span className="text-gray-700">{contact.address}</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
