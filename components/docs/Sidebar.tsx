'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Menu, X } from 'lucide-react';
import type { SidebarSection } from '@/lib/docs/sidebar';

interface SidebarProps {
  sections: SidebarSection[];
}

function SidebarContent({
  sections,
  pathname,
}: {
  sections: SidebarSection[];
  pathname: string;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-4">
      <Link
        href="/docs"
        className="flex items-center gap-2 mb-6 text-orange-500 font-semibold hover:text-orange-600 transition-colors"
      >
        <BookOpen className="h-5 w-5" />
        <span>Documentation</span>
      </Link>

      {sections.map((section) => {
        const isOpen = !collapsed[section.title];
        return (
          <div key={section.title} className="mb-6">
            <button
              onClick={() => toggleSection(section.title)}
              className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <span>{section.title}</span>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>

            {isOpen && (
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname === '/docs' && item.slug === 'getting-started');
                  return (
                    <li key={item.slug}>
                      <Link
                        href={item.href}
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-orange-500 text-white rounded-full p-3 shadow-lg"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent sections={sections} pathname={pathname} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-gray-200 dark:border-gray-800 min-h-full bg-white dark:bg-gray-950">
        <SidebarContent sections={sections} pathname={pathname} />
      </aside>
    </>
  );
}
