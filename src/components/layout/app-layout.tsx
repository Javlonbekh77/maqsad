
import AppHeader from "./app-header";
import AppSidebar from "./app-sidebar";
import MobileBottomNav from "./mobile-bottom-nav";
import AiChatAssistant from "../ai/ai-chat-assistant";
import GlobalTimerWidget from "../global-timer-widget";
import { useEffect } from "react";
import AppFooter from "./app-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar />
      <div className="flex flex-col sm:pl-64">
        <AppHeader />
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex-grow">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>
      <MobileBottomNav />
      <AiChatAssistant />
      <GlobalTimerWidget />
    </div>
  )
}
