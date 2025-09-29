import {
  createLocalizedPathnamesNavigation,
  Pathnames
} from 'next-intl/navigation';
 
export const locales = ['en', 'uz'] as const;
export type Locale = typeof locales[number];
 
// The `pathnames` object holds pairs of internal
// and external paths, separated by locale.
export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/groups': '/groups',
  '/leaderboard': '/leaderboard',
  '/profile/[id]': {
    en: '/profile/[id]',
    uz: '/profil/[id]'
  },
  '/groups/[id]': '/groups/[id]',
} satisfies Pathnames<typeof locales>;
 
export const {Link, redirect, usePathname, useRouter} =
  createLocalizedPathnamesNavigation({locales, pathnames});