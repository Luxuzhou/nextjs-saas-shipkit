'use client';

import { useState } from 'react';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文'
};

export function LocaleSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (locale: Locale) => {
    setCurrentLocale(locale);
    setIsOpen(false);
    // When Lead integrates locale routing, this will trigger navigation
    // For now, we store the preference and close the dropdown
    if (typeof window !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch language"
      >
        <span>{localeLabels[currentLocale]}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Language options"
          className="absolute right-0 z-50 mt-1 min-w-[8rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {locales.map((locale) => (
            <li key={locale} role="option" aria-selected={locale === currentLocale}>
              <button
                type="button"
                onClick={() => handleLocaleChange(locale)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  locale === currentLocale
                    ? 'font-semibold text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {localeLabels[locale]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
