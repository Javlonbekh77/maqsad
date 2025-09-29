import AppHeader from "./app-header";
import AppSidebar from "./app-sidebar";
import MobileBottomNav from "./mobile-bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <div className="hidden sm:block">
           <AppHeader />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
