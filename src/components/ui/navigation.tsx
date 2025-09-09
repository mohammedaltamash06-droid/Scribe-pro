
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Users, BarChart3, LogIn } from 'lucide-react';

// tiny helper instead of '@/lib/utils'
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const NAV = [
  { name: 'Transcribe', href: '/transcribe', icon: FileText },
  { name: 'Doctor',     href: '/doctor',     icon: Users },
  { name: 'Dashboard',  href: '/dashboard',  icon: BarChart3 },
];

function NavigationInner() {
  const pathname = usePathname() || '/';

  return (
    <nav className="flex w-full items-center justify-between bg-card/80 backdrop-blur rounded-xl p-1 shadow">
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

// export both to be safe with existing imports
export default function Navigation() { return <NavigationInner />; }
export { NavigationInner as Navigation };