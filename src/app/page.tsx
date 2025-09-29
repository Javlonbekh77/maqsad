import { redirect } from '@/navigation';

// This page only redirects to the default locale.
export default function RootPage() {
  redirect('/dashboard');
}
