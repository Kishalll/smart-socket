'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardPage } from '@/components/pages/dashboard';
import { HostelBlocksPage } from '@/components/pages/hostel-blocks';
import { RoomsPage } from '@/components/pages/rooms';
import { StudentsPage } from '@/components/pages/students';
import { SocketsPage } from '@/components/pages/sockets';
import { PowerEventsPage } from '@/components/pages/power-events';
import { LoadRulesPage } from '@/components/pages/load-rules';
import { WardensPage } from '@/components/pages/wardens';
import { ViolationsPage } from '@/components/pages/violations';
import { FinesPage } from '@/components/pages/fines';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  'hostel-blocks': HostelBlocksPage,
  rooms: RoomsPage,
  students: StudentsPage,
  sockets: SocketsPage,
  'power-events': PowerEventsPage,
  'load-rules': LoadRulesPage,
  wardens: WardensPage,
  violations: ViolationsPage,
  fines: FinesPage,
};

export default function Home() {
  const { currentPage, sidebarOpen, toggleSidebar } = useAppStore();
  const PageComponent = pages[currentPage] || DashboardPage;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-200 ease-out',
          sidebarOpen ? 'ml-56' : 'ml-14'
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-12 px-4 border-b border-border/60 bg-background/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 mr-2"
            onClick={toggleSidebar}
          >
            <Menu size={16} />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">HostelWatch</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium capitalize">
              {currentPage.replace('-', ' ')}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-5 max-w-7xl">
          <PageComponent />
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border/40 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-muted-foreground/60">
            <span>Hostel Socket Load &amp; Appliance Violation Monitoring System</span>
            <span>BCSE302L — Database Systems</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
