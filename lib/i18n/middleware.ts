import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config';

export const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export { locales, defaultLocale };
