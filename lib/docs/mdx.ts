import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content/docs');

export interface DocFrontmatter {
  title: string;
  description: string;
  order: number;
}

export interface DocMeta extends DocFrontmatter {
  slug: string;
  href: string;
}

export interface DocContent extends DocMeta {
  content: string;
}

export function getDocSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getDocBySlug(slug: string): DocContent | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  return {
    slug,
    href: `/docs/${slug}`,
    title: (data.title as string) || slug,
    description: (data.description as string) || '',
    order: (data.order as number) || 999,
    content,
  };
}

export function getAllDocs(): DocContent[] {
  const slugs = getDocSlugs();
  const docs = slugs
    .map((slug) => getDocBySlug(slug))
    .filter((doc): doc is DocContent => doc !== null);
  return docs.sort((a, b) => a.order - b.order);
}

export function getAllDocMetas(): DocMeta[] {
  return getAllDocs().map(({ content: _content, ...meta }) => meta);
}
