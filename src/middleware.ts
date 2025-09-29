import createMiddleware from 'next-intl/middleware';
import {locales, pathnames, localePrefix} from './navigation';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches
  defaultLocale: 'uz',

  // Always use a locale prefix
  localePrefix,
  
  // The `pathnames` object holds pairs of internal
  // and external paths, separated by locale.
  pathnames,
});
 
export const config = {
  // Match only internationalized pathnames
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