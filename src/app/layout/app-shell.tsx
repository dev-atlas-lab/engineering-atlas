import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MainContent } from './main-content';
import { ThemeProvider } from '../theme-context';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="min-h-dvh bg-bg">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="pt-(--height-header) lg:pl-(--width-sidebar)">
          <MainContent />
        </div>
      </div>
    </ThemeProvider>
  );
}
