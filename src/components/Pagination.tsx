'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages,
  baseUrl = '/articles' 
}: PaginationProps) {
  const searchParams = useSearchParams();
  
  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // 最多显示的页码数
    
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 始终显示第一页
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // 始终显示最后一页
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // 生成带分页参数的URL
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center items-center gap-2" aria-label="分页">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="上一页"
        >
          上一页
        </Link>
      ) : (
        <span className="px-4 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
          上一页
        </span>
      )}

      {/* 页码 */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          );
        }
        
        const isActive = page === currentPage;
        return (
          <Link
            key={page}
            href={getPageUrl(page as number)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-900 text-white'
                : 'border border-gray-300 hover:bg-gray-100'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </Link>
        );
      })}

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="下一页"
        >
          下一页
        </Link>
      ) : (
        <span className="px-4 py-2 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed">
          下一页
        </span>
      )}
    </nav>
  );
}
