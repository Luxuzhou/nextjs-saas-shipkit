import { getAllDocs, type DocContent } from './mdx';

export interface SearchResult {
  slug: string;
  href: string;
  title: string;
  description: string;
  excerpt: string;
}

function stripMdx(content: string): string {
  return content
    // Remove frontmatter fences (handled by gray-matter already, but just in case)
    .replace(/^---[\s\S]*?---\n/, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchDocs(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const docs: DocContent[] = getAllDocs();
  const normalizedQuery = query.toLowerCase().trim();
  const terms = normalizedQuery.split(/\s+/);

  const results: Array<{ doc: DocContent; score: number }> = [];

  for (const doc of docs) {
    const plainContent = stripMdx(doc.content);
    const haystack =
      `${doc.title} ${doc.description} ${plainContent}`.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (doc.title.toLowerCase().includes(term)) score += 3;
      if (doc.description.toLowerCase().includes(term)) score += 2;
      if (plainContent.toLowerCase().includes(term)) score += 1;
    }

    if (score > 0) {
      results.push({ doc, score });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 10).map(({ doc }) => {
    const plainContent = stripMdx(doc.content);
    const idx = plainContent.toLowerCase().indexOf(normalizedQuery);
    let excerpt = '';
    if (idx !== -1) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(plainContent.length, idx + 120);
      excerpt = (start > 0 ? '...' : '') + plainContent.slice(start, end) + (end < plainContent.length ? '...' : '');
    } else {
      excerpt = plainContent.slice(0, 150) + (plainContent.length > 150 ? '...' : '');
    }

    return {
      slug: doc.slug,
      href: doc.href,
      title: doc.title,
      description: doc.description,
      excerpt,
    };
  });
}
