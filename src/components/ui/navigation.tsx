"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Users, BarChart3, LogIn } from 'lucide-react';

  /**
   * Tiny local classnames helper so we don't depend on '@/lib/utils'
   */
  function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Keep the same tabs/labels you already show in the UI.
   * If you need to add/remove tabs, edit this array only.
   */
  const NAV = [
    { name: 'Transcribe', href: '/transcribe', icon: FileText },
    { name: 'Doctor',     href: '/doctor',     icon: Users },
    { name: 'Dashboard',  href: '/dashboard',  icon: BarChart3 },
  ];

export default function Navigation() {
    const pathname = usePathname() || '/';

    return (
      <nav className="flex w-full items-center justify-between bg-card/80 backdrop-blur rounded-xl p-1 shadow">
        {/* Left: main tabs */}
        <div className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (pathname.startsWith(item.href + '/') && item.href !== '/');

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  'flex items-center gap-2 rounded-md px-4 py-2 transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-secondary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: login link (kept as in your UI) */}
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-md px-4 py-2 text-muted-foreground hover:bg-secondary transition-all"
        >
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </Link>
      </nav>
    );
  }