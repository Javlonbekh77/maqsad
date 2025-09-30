import {getLocale, getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from './navigation';

export default getRequestConfig(async () => {
  const locale = await getLocale();
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();
 
  return {
    messages: (await import(`../locales/${locale}.json`)).default
  };
});
