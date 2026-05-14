'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBox from '@/components/SearchBox';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { name: '首页', href: '/' },
    { name: '专业领域', href: '/category' },
    { name: '文章列表', href: '/articles' },
    { name: '关于律师', href: '/about' },
    { name: '收费标准', href: '/fees' },
    { name: '联系我', href: '/contact' },
  ];

  return (
    <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Phone */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400">
                <Image
                  src="/images/logo.png"
                  alt="吕婷律师"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">苏州吕婷律师</h1>
              </div>
            </Link>

            {/* Phone - always visible */}
            <a href="tel:0512-88822000" className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors text-lg font-bold">
              <span>📞</span>
              <span>0512-88822000</span>
            </a>
          </div>

          {/* Right: Desktop Nav + Search */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-yellow-400 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
            {/* Search Button */}
            <Link
              href="/search"
              className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 transition-colors"
              aria-label="搜索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden">
            {/* Mobile Search */}
            <Link href="/search" className="p-2" aria-label="搜索">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-blue-800">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 hover:text-yellow-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
