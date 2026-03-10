import Link from 'next/link';
import { CircleIcon } from 'lucide-react';
import { getSidebar } from '@/lib/docs/sidebar';
import { Sidebar } from '@/components/docs/Sidebar';
import { DocsSearchWrapper } from './search-wrapper';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sections = getSidebar();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <CircleIcon className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">ACME</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link
                href="/docs"
                className="text-orange-500 font-medium"
              >
                Docs
              </Link>
              <Link
                href="/dashboard/api-docs"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                API Reference
              </Link>
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Home
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <DocsSearchWrapper />
            <Link
              href="/sign-in"
              className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        <Sidebar sections={sections} />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
