import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true
  }
};

export default withNextIntl(nextConfig);
