import Image from 'next/image';

const images = [
  { src: '/images/fengcai/EDrop_1725429566257.jpg', alt: '律师风采' },
  { src: '/images/fengcai/微信图片_2026-05-06_203942_555.jpg', alt: '律师风采1' },
  { src: '/images/fengcai/微信图片_2026-05-06_204016_822.jpg', alt: '律师风采2' },
  { src: '/images/fengcai/微信图片_2026-05-06_204039_108.jpg', alt: '律师风采3' },
  { src: '/images/fengcai/微信图片_2026-05-06_204050_434.jpg', alt: '律师风采4' },
];

export default function FengcaiPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">律师风采</h1>
          <p className="text-gray-600">吕婷律师工作风采展示</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {images.map((img, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
