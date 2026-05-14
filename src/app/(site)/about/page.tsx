import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于吕婷律师 - 专业刑事辩护、婚姻家庭法律服务',
  description: '了解吕婷律师的专业背景、执业领域和服务理念。苏州资深律师，擅长刑事辩护、婚姻家庭、房产纠纷等法律服务。',
  keywords: '吕婷律师,苏州律师,刑事辩护,婚姻家庭,房产纠纷,法律顾问',
};

async function getPageContent(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost';
    const res = await fetch(`${baseUrl}/api/site/pages/about`, { cache: 'no-store' });
    if (!res.ok) return '';
    const data = await res.json();
    return data.content || '';
  } catch {
    return '';
  }
}

export default async function AboutPage() {
  const content = await getPageContent();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">关于吕婷律师</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            专业、负责、高效 - 您的法律顾问
          </p>
        </div>

        {/* 律师简介 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative h-[500px] w-[500px] mx-auto lg:mx-0 overflow-hidden">
            <Image
              src="/images/lvting-portrait.png"
              alt="吕婷律师"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">吕婷律师</h2>
            {content ? (
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <>
                <p className="text-lg text-gray-600 mb-6">
                  吕婷律师拥有多年的法律实务经验，擅长处理各类复杂法律案件。
                  秉持"专业、负责、高效"的服务理念，为每一位客户提供优质的法律服务。
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-900 rounded-full" />
                    <span className="text-gray-700">江苏臻万律师事务所 合伙人、副主任律师</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-900 rounded-full" />
                    <span className="text-gray-700">中华全国律师协会会员</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-900 rounded-full" />
                    <span className="text-gray-700">江苏省律师协会会员</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-900 rounded-full" />
                    <span className="text-gray-700">第15届苏州律师辩论比赛二等奖</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-900 rounded-full" />
                    <span className="text-gray-700">7年法律从业实践经验</span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
                >
                  预约咨询
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 执业领域 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">执业领域</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: '刑事辩护', desc: '专业的刑事辩护服务，包括取保候审、无罪辩护、罪轻辩护等', icon: '⚖️' },
              { title: '婚姻家庭', desc: '离婚诉讼、财产分割、子女抚养、婚前财产协议等', icon: '👨‍👩‍👧‍👦' },
              { title: '房产纠纷', desc: '房屋买卖纠纷、房产继承、拆迁补偿等', icon: '🏠' },
              { title: '劳动工伤', desc: '劳动争议仲裁、工伤认定、劳动能力鉴定等', icon: '💼' },
              { title: '经济合同', desc: '合同纠纷、债权债务、公司法律顾问等', icon: '📋' },
              { title: '建筑工程', desc: '工程款纠纷、工程质量、建设工程合同等', icon: '🏗️' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 律师风采 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">江苏臻万律师事务所</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { src: "/images/fengcai/EDrop_1725429566257.jpg", alt: "律师风采" },
              { src: "/images/fengcai/微信图片_2026-05-06_203942_555.jpg", alt: "律师风采1" },
              { src: "/images/fengcai/微信图片_2026-05-06_204016_822.jpg", alt: "律师风采2" },
              { src: "/images/fengcai/微信图片_2026-05-06_204039_108.jpg", alt: "律师风采3" },
              { src: "/images/fengcai/微信图片_2026-05-06_204050_434.jpg", alt: "律师风采4" },
            ].map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-auto object-cover" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
