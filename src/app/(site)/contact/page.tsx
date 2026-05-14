import { contact } from '@/lib/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '联系吕婷律师 - 在线预约咨询',
  description: '联系苏州吕婷律师，预约法律咨询服务。电话：0512-88822000，24小时热线：0512-69633555，微信：282131。',
  keywords: '联系律师,法律咨询,预约咨询,苏州律师,吕婷律师',
};

export default function ContactPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">联系吕婷律师</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            如有法律问题，欢迎通过以下方式联系，我们将尽快回复您
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 联系信息 */}
          <div>
            <h2 className="text-2xl font-bold mb-8">联系方式</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📞</span>
                </div>
                <div>
                  <h3 className="font-bold mb-1">电话咨询</h3>
                  <p className="text-gray-600">咨询热线：{contact.phone}</p>
                  <p className="text-sm text-gray-500">24小时热线：{contact.phone24h}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="font-bold mb-1">办公地址</h3>
                  <p className="text-gray-600">{contact.address}</p>
                  <p className="text-sm text-gray-500">预约来访</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="font-bold mb-1">微信咨询</h3>
                  <p className="text-gray-600">微信号：{contact.wechat}（{contact.wechatNote}）</p>
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mt-3 flex items-center justify-center">
                    <span className="text-gray-400">微信二维码</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 咨询表单 */}
          <div>
            <h2 className="text-2xl font-bold mb-8">在线咨询</h2>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  您的姓名 *
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="请输入您的姓名"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  联系电话 *
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="请输入您的联系电话"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  咨询类型
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="">请选择咨询类型</option>
                  <option value="criminal">刑事辩护</option>
                  <option value="marriage">婚姻家庭</option>
                  <option value="property">房产纠纷</option>
                  <option value="labor">工伤交通</option>
                  <option value="company">公司劳务</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  详细描述 *
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  placeholder="请详细描述您的问题..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
              >
                提交咨询
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
