// This layout is needed to prevent the "page.tsx doesn't have a root layout" error
// for the root page.tsx that handles the initial redirect.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
