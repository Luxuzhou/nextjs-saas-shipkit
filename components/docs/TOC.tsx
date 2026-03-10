'use client';

import { useEffect, useState } from 'react';
import type { Heading } from '@/lib/docs/headings';

interface TOCProps {
  headings: Heading[];
}

export function TOC({ headings }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 text-sm" aria-label="Table of contents">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-xs uppercase tracking-wider">
        On this page
      </p>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
          >
            <a
              href={`#${h.id}`}
              className={`block py-0.5 text-sm transition-colors hover:text-orange-500 ${
                activeId === h.id
                  ? 'text-orange-500 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
