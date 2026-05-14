import Link from 'next/link';
import { contact, beian } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 联系信息 */}
          <div>
            <h3 className="text-xl font-bold mb-4">联系吕婷律师</h3>
            <ul className="space-y-2 text-blue-200">
              <li>咨询热线：{contact.phone}</li>
              <li>24小时热线：{contact.phone24h}</li>
              <li>微信：{contact.wechat}（{contact.wechatNote}）</li>
              <li>地址：{contact.address}</li>
            </ul>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-xl font-bold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-blue-200 hover:text-yellow-400">
                  关于律师
                </Link>
              </li>
              <li>
                <Link href="/fees" className="text-blue-200 hover:text-yellow-400">
                  收费标准
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-blue-200 hover:text-yellow-400">
                  文章列表
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-blue-200 hover:text-yellow-400">
                  在线咨询
                </Link>
              </li>
            </ul>
          </div>

          {/* 专业领域 */}
          <div>
            <h3 className="text-xl font-bold mb-4">专业领域</h3>
            <ul className="space-y-2 text-blue-200">
              <li>刑事辩护</li>
              <li>婚姻家庭</li>
              <li>房产纠纷</li>
              <li>工伤交通</li>
              <li>公司劳务</li>
              <li>经济生活</li>
            </ul>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-300">
          <p>&copy; {new Date().getFullYear()} 吕婷律师 版权所有</p>
          <p className="mt-2 text-sm">
            <Link href="/privacy" className="hover:text-yellow-400">
              隐私政策
            </Link>
            {' | '}
            <Link href="/disclaimer" className="hover:text-yellow-400">
              免责声明
            </Link>
          </p>
          <p className="mt-2 text-sm">
            <a href={beian.url} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400">
              {beian.number}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
