import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { getDocBySlug, getAllDocMetas, type DocContent } from '@/lib/docs/mdx';
import { TOC } from '@/components/docs/TOC';
import { extractHeadings } from '@/lib/docs/headings';
import { CodeBlock } from '@/components/docs/CodeBlock';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  const metas = getAllDocMetas();
  const params = [
    { slug: undefined },
    ...metas.map((m) => ({ slug: [m.slug] })),
  ];
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const docSlug = slug?.[0] ?? 'getting-started';
  const doc = getDocBySlug(docSlug);
  if (!doc) return { title: 'Not Found' };
  return {
    title: `${doc.title} — Documentation`,
    description: doc.description,
  };
}

// MDX component overrides
const components = {
  pre: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre {...props}>{children}</pre>
  ),
  code: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => {
    // Block code (has language class)
    if (className?.startsWith('language-')) {
      return (
        <CodeBlock className={className}>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    }
    // Inline code
    return (
      <code
        className="bg-gray-100 dark:bg-gray-800 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded text-[0.875em]"
        {...props}
      >
        {children}
      </code>
    );
  },
  a: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className="text-orange-500 hover:text-orange-600 underline underline-offset-2">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-500 hover:text-orange-600 underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    );
  },
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-6">
      <table
        className="min-w-full border-collapse border border-gray-200 dark:border-gray-700 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-600 dark:text-gray-400"
      {...props}
    >
      {children}
    </td>
  ),
};

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const docSlug = slug?.[0] ?? 'getting-started';

  const doc: DocContent | null = getDocBySlug(docSlug);
  if (!doc) notFound();

  const allMetas = getAllDocMetas();
  const currentIdx = allMetas.findIndex((m) => m.slug === docSlug);
  const prev = currentIdx > 0 ? allMetas[currentIdx - 1] : null;
  const next = currentIdx < allMetas.length - 1 ? allMetas[currentIdx + 1] : null;

  const headings = extractHeadings(doc.content);

  return (
    <div className="flex gap-8 px-6 lg:px-10 py-8 max-w-5xl">
      {/* Main content */}
      <article className="flex-1 min-w-0 prose prose-gray dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:no-underline">
        <header className="not-prose mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {doc.description}
            </p>
          )}
        </header>

        <MDXRemote
          source={doc.content}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, rehypeHighlight],
            },
          }}
        />

        {/* Prev/Next navigation */}
        {(prev || next) && (
          <nav className="not-prose mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={prev.href}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors group"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Previous</p>
                  <p className="font-medium">{prev.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={next.href}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors group text-right"
              >
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Next</p>
                  <p className="font-medium">{next.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </article>

      {/* Table of contents — desktop only */}
      <aside className="hidden xl:block w-56 flex-shrink-0">
        <TOC headings={headings} />
      </aside>
    </div>
  );
}
