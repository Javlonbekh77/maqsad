import createMiddleware from 'next-intl/middleware';
import { locales, pathnames } from './navigation';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // The deafult locale to use when no locale is specified
  defaultLocale: 'uz',

  // The `pathnames` object holds pairs of internal
  // and external paths, separated by locale.
  pathnames,
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // However, match all pathnames within `/`
    '/'
  ]
};