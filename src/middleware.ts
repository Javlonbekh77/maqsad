import createMiddleware from 'next-intl/middleware';
import {locales, pathnames, localePrefix} from './navigation';
 
export default createMiddleware({
  defaultLocale: 'uz',
  locales,
  pathnames,
  localePrefix,
});
 
export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(uz|en)/:path*',

    // Enable redirects that add a locale prefix
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|api|.*\\..*).*)'
  ]
};
