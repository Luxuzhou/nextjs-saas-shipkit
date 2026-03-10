import { getAllDocMetas, type DocMeta } from './mdx';

export interface SidebarItem {
  title: string;
  href: string;
  slug: string;
  order: number;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export function getSidebarItems(): SidebarItem[] {
  const metas: DocMeta[] = getAllDocMetas();
  return metas.map((meta) => ({
    title: meta.title,
    href: meta.href,
    slug: meta.slug,
    order: meta.order,
  }));
}

export function getSidebar(): SidebarSection[] {
  const items = getSidebarItems();
  // For now, all items are in a single "Documentation" section.
  // This can be extended to support subdirectories/categories.
  return [
    {
      title: 'Documentation',
      items,
    },
  ];
}
