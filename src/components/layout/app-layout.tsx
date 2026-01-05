
import AppHeader from "./app-header";
import AppSidebar from "./app-sidebar";
import MobileBottomNav from "./mobile-bottom-nav";
import AiChatAssistant from "../ai/ai-chat-assistant";
import GlobalTimerWidget from "../global-timer-widget";
import { useEffect } from "react";
import './snow-effect.css';

const Snow = () => {
    // Create an array of snowflakes to render
    const snowflakes = Array.from({ length: 150 }).map((_, i) => (
        <div key={i} className="snowflake"></div>
    ));
    return <div className="snow-container">{snowflakes}</div>;
};


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
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      <Snow />
      <AppSidebar />
      <div className="flex flex-col sm:gap-4 sm:pl-64">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 pb-20 sm:pb-6 z-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <AiChatAssistant />
      <GlobalTimerWidget />
    </div>
  )
}
