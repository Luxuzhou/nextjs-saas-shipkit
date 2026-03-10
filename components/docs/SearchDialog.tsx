'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, X, FileText } from 'lucide-react';
import type { SearchResult } from '@/lib/docs/search';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/docs/search?q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) {
        const data = (await res.json()) as SearchResult[];
        setResults(data);
        setSelectedIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void handleSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onClose();
      window.location.href = results[selectedIndex].href;
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:block text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-sm text-gray-400">
              Searching...
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((result, idx) => (
                <li key={result.slug}>
                  <Link
                    href={result.href}
                    onClick={onClose}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      idx === selectedIndex
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : ''
                    }`}
                  >
                    <FileText className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {result.excerpt}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!query && (
            <div className="p-6 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Type to search documentation
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="border border-gray-300 dark:border-gray-600 rounded px-1">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-gray-300 dark:border-gray-600 rounded px-1">↵</kbd>
            open
          </span>
        </div>
      </div>
    </div>
  );
}

// Trigger button component
interface SearchTriggerProps {
  onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-900"
    >
      <Search className="h-4 w-4" />
      <span>Search docs</span>
      <kbd className="hidden sm:block ml-auto text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">
        ⌘K
      </kbd>
    </button>
  );
}
