import { Link } from 'react-router';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme-context';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 z-30 flex h-(--height-header) w-full items-center justify-between border-b border-border bg-surface px-2 sm:px-4">
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg-subtle hover:text-text lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <Link to="/" className="truncate px-1 text-[15px] font-semibold tracking-tight text-text">
          Engineering Atlas
        </Link>
      </div>

      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text"
      >
        {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </button>
    </header>
  );
}
