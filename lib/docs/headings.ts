export interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract headings from MDX content string.
 * This is a pure utility function safe to call on the server.
 */
export function extractHeadings(content: string): Heading[] {
  const regex = /^(#{2,4})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`]/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    headings.push({ id, text, level });
  }

  return headings;
}
