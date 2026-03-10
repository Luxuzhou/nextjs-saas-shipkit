'use client';

import { useState, useEffect } from 'react';
import { SearchDialog, SearchTrigger } from '@/components/docs/SearchDialog';

export function DocsSearchWrapper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SearchTrigger onClick={() => setOpen(true)} />
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
