import { useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { Layout } from './components/Layout';
import { PageTransition } from './components/PageTransition';
import { Splash } from './screens/Splash';
import { UsernameClaim } from './screens/UsernameClaim';
import { Home } from './screens/Home';
import { Matchmaking } from './screens/Matchmaking';
import { Match } from './screens/Match';
import { Results } from './screens/Results';
import { Leaderboards } from './screens/Leaderboards';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { Learn } from './screens/Learn';

import { useAuthStore } from './store/useAuthStore';
import { useMatchStore } from './store/useMatchStore';
import { useSettingsStore, resolveEffectiveTheme } from './store/useSettingsStore';
import { getSocket } from './lib/socket';

function useApplyThemeAndLocale() {
  const theme = useSettingsStore((s) => s.theme);
  const locale = useSettingsStore((s) => s.locale);

  useEffect(() => {
    const effective = resolveEffectiveTheme(theme);
    document.documentElement.dataset.theme = effective;
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        document.documentElement.dataset.theme = mq.matches ? 'dark' : 'light';
      };
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
}

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <div className="grid min-h-screen place-items-center text-text-lo">…</div>;
  if (status === 'anonymous') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  useApplyThemeAndLocale();
  const status = useAuthStore((s) => s.status);
  const refresh = useAuthStore((s) => s.refresh);
  const bindSocketListeners = useMatchStore((s) => s.bindSocketListeners);
  const location = useLocation();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Connect (or reconnect) only once the auth cookie actually exists —
    // connecting earlier gets rejected by the server's socket auth
    // middleware and, since the client doesn't auto-retry with a *newly
    // available* cookie, would otherwise leave the app permanently
    // unable to matchmake after login. Bound once for the app's lifetime
    // (not per-screen) so events fired while the user is on /matchmaking
    // — e.g. match:found — aren't dropped just because /match hasn't
    // mounted yet.
    if (status !== 'authenticated') return;
    const socket = getSocket();
    const unbind = bindSocketListeners();
    socket.connect();
    return () => {
      unbind();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Splash /></PageTransition>} />
        <Route path="/username" element={<PageTransition><UsernameClaim /></PageTransition>} />

        <Route element={<Layout />}>
          <Route path="/home" element={<RequireAuth><PageTransition><Home /></PageTransition></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><PageTransition><Leaderboards /></PageTransition></RequireAuth>} />
          <Route path="/learn" element={<RequireAuth><PageTransition><Learn /></PageTransition></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><PageTransition><Profile /></PageTransition></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><PageTransition><Settings /></PageTransition></RequireAuth>} />
        </Route>

        <Route path="/matchmaking" element={<RequireAuth><PageTransition><Matchmaking /></PageTransition></RequireAuth>} />
        <Route path="/match" element={<RequireAuth><PageTransition><Match /></PageTransition></RequireAuth>} />
        <Route path="/results" element={<RequireAuth><PageTransition><Results /></PageTransition></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
