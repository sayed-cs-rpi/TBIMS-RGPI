'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ReactNode } from 'react';

export const pageShellClass =
  'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-foreground';

export const panelClass = 'glass-card rounded-2xl';
export const cardClass = `${panelClass} p-6 sm:p-8`;
export const statCardClass = `${panelClass} p-5`;
export const emptyStateClass = `${cardClass} text-center py-12`;

export const fieldClass =
  'w-full px-4 py-3 glass-input text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all rounded-xl';

export const primaryBtnClass =
  'glass-button text-white font-medium px-5 py-2.5 transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

export const secondaryBtnClass =
  'glass-button-secondary text-primary font-medium px-5 py-2.5 transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

export const pageTitleClass = 'text-2xl sm:text-3xl font-semibold tracking-tight text-foreground';
export const pageSubClass = 'text-foreground/60 text-sm mt-1.5';

export function PageFooter() {
  return (
    <footer className="border-t border-border/40 px-4 py-5 text-center text-xs text-foreground/45">
      <p>Copyright &copy; {new Date().getFullYear()} absyd. All Rights Reserved.</p>
      <p className="mt-0.5">Ticket-based issue management for RGPI.</p>
    </footer>
  );
}

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className={`animate-spin rounded-full ${sizeClass} border-2 border-foreground/20 border-t-foreground mx-auto`} />
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className={`${pageShellClass} flex flex-col`}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-foreground/60 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className={`${pageShellClass} flex flex-col`}>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className={`${cardClass} max-w-sm w-full text-center space-y-4`}>
          <p className="text-lg font-medium text-foreground">Access Denied</p>
          <p className="text-sm text-foreground/60">You don&apos;t have permission to view this page.</p>
          <Link href="/login" className={`inline-block ${primaryBtnClass}`}>
            Sign In
          </Link>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}

export function StandaloneShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${pageShellClass} flex flex-col`}>
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
      <PageFooter />
    </div>
  );
}

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface AppShellProps {
  title: string;
  icon: ReactNode;
  nav: NavItem[];
  userName: string;
  onSignOut: () => void;
  children: ReactNode;
}

function isNavActive(pathname: string, href: string) {
  const roots = ['/admin', '/complainer', '/technician', '/staff'];
  if (roots.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ title, icon, nav, userName, onSignOut, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className={`${pageShellClass} flex flex-col`}>
      <header className="glass-header sticky top-0 z-50 border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              {icon}
            </span>
            <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
          </div>

          <nav className="flex items-center gap-1 flex-wrap justify-end">
            {nav.map(item => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <div className="flex items-center gap-2 pl-2 ml-2 border-l border-border/40">
              <span className="text-sm text-foreground/60 hidden md:inline max-w-[10rem] truncate">
                {userName}
              </span>
              <button
                onClick={onSignOut}
                className="p-2 text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition rounded-lg"
                title="Sign out"
                type="button"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
      <PageFooter />
    </div>
  );
}
