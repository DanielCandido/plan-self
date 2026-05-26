'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { WorkspaceLayout } from '@plan-self/ui';
import { PrivateShellProvider } from './private-shell-context';

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrivateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/dashboard', active: isRouteActive(pathname, '/dashboard') },
      { label: 'My Tasks', href: '/my-tasks', active: isRouteActive(pathname, '/my-tasks') },
      { label: 'Projects', href: '/projects', active: isRouteActive(pathname, '/projects') },
      { label: 'Team', href: '/team', active: isRouteActive(pathname, '/team') },
      { label: 'Reports', href: '/reports', active: isRouteActive(pathname, '/reports') },
    ],
    [pathname],
  );

  return (
    <PrivateShellProvider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar: () => setSidebarOpen((current) => !current),
      }}
    >
      <WorkspaceLayout
        sidebarOpen={sidebarOpen}
        onSidebarChange={setSidebarOpen}
        navItems={navItems}
        sidebarFooter={
          <div className="space-y-3 px-1 text-sm text-white/45">
            <div>Settings</div>
            <div>Support</div>
          </div>
        }
        mainClassName="bg-[#0d0e14]"
        sidebarClassName="w-72"
        desktopSidebarVisibilityClassName="xl:flex xl:flex-col"
        contentOffsetClassName="xl:ml-72"
        contentClassName="py-5 xl:px-8"
      >
        {children}
      </WorkspaceLayout>
    </PrivateShellProvider>
  );
}
