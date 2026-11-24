import { useEffect, useState } from 'react';
import { Header } from './header';
import { Sidebar, type SidebarMode } from './sidebar';
import { MainContent } from './main-content';
import { ThemeProvider } from '../theme-context';
import { useProgressStore } from '../../stores/progress-store';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');
  const loadProgress = useProgressStore((s) => s.load);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  return (
    <ThemeProvider>
      <div className="min-h-dvh bg-bg">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          mode={sidebarMode}
          onToggleMode={() => setSidebarMode((m) => (m === 'expanded' ? 'rail' : 'expanded'))}
        />

        <div
          className={
            sidebarMode === 'rail'
              ? 'pt-(--height-header) lg:pl-(--width-sidebar-rail)'
              : 'pt-(--height-header) lg:pl-(--width-sidebar)'
          }
        >
          <MainContent />
        </div>
      </div>
    </ThemeProvider>
  );
}
