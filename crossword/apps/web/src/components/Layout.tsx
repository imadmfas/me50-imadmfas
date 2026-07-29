import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { DeveloperFooterLink } from './DeveloperModal';
import { useT } from '../i18n';
import clsx from '../lib/clsx';

const NAV = [
  { to: '/home', key: 'nav.home', icon: '🏠' },
  { to: '/leaderboard', key: 'nav.leaderboard', icon: '🏆' },
  { to: '/learn', key: 'nav.learn', icon: '📚' },
  { to: '/profile', key: 'nav.profile', icon: '👤' },
  { to: '/settings', key: 'nav.settings', icon: '⚙️' },
] as const;

export function Layout() {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-24 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-text-hi">{t('app.name')}</h1>
        <ThemeToggle />
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <DeveloperFooterLink />

      <nav
        aria-label="التنقل الرئيسي"
        className="glass-panel fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl items-center justify-around py-2"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex min-h-[44px] flex-col items-center justify-center rounded-xl px-3 py-1 text-xs',
                isActive ? 'text-neon-cyan' : 'text-text-lo',
              )
            }
          >
            <span aria-hidden="true" className="text-lg">{item.icon}</span>
            {t(item.key as never)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
