
import {
  createLocalizedPathnamesNavigation,
  Pathnames
} from 'next-intl/navigation';
 
export const locales = ['en', 'uz'] as const;
export type Locale = typeof locales[number];
export const localePrefix = 'always';
 
export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/groups': '/groups',
  '/leaderboard': '/leaderboard',
  '/settings': '/settings',
  '/login': '/login',
  '/signup': '/signup',
  '/profile/[id]': {
    en: '/profile/[id]',
    uz: '/profil/[id]'
  },
  '/groups/[id]': '/groups/[id]',
} satisfies Pathnames<typeof locales>;
 
export const {Link, redirect, usePathname, useRouter} =
  createLocalizedPathnamesNavigation({locales, pathnames, localePrefix});


