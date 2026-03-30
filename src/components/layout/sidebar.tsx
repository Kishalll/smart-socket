'use client';

import { useAppStore, type Page } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  Plug,
  Zap,
  ShieldAlert,
  UserCheck,
  AlertTriangle,
  Banknote,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  page: Page;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, section: 'overview' },
  { page: 'hostel-blocks', label: 'Hostel Blocks', icon: <Building2 size={18} />, section: 'manage' },
  { page: 'rooms', label: 'Rooms', icon: <DoorOpen size={18} />, section: 'manage' },
  { page: 'students', label: 'Students', icon: <Users size={18} />, section: 'manage' },
  { page: 'sockets', label: 'Sockets', icon: <Plug size={18} />, section: 'manage' },
  { page: 'power-events', label: 'Power Events', icon: <Zap size={18} />, section: 'monitor' },
  { page: 'load-rules', label: 'Load Rules', icon: <ShieldAlert size={18} />, section: 'monitor' },
  { page: 'wardens', label: 'Wardens', icon: <UserCheck size={18} />, section: 'manage' },
  { page: 'violations', label: 'Violations', icon: <AlertTriangle size={18} />, section: 'enforce' },
  { page: 'fines', label: 'Fines', icon: <Banknote size={18} />, section: 'enforce' },
];

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const { currentPage, setPage, sidebarOpen } = useAppStore();

  const sections = ['overview', 'manage', 'monitor', 'enforce'] as const;
  const sectionLabels: Record<string, string> = {
    overview: '',
    manage: 'MANAGEMENT',
    monitor: 'MONITORING',
    enforce: 'ENFORCEMENT',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-14 shrink-0 border-b border-sidebar-border/50",
        collapsed && "px-3 justify-center"
      )}>
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-sidebar-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight truncate">HostelWatch</span>
            <span className="text-[10px] text-sidebar-foreground/50 leading-none truncate">Violation Monitor</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col px-2 gap-0.5">
          {sections.map((section) => {
            const items = navItems.filter((item) => item.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section} className="mb-2">
                {!collapsed && sectionLabels[section] && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-sidebar-foreground/35 uppercase">
                    {sectionLabels[section]}
                  </div>
                )}
                {collapsed && sectionLabels[section] && (
                  <Separator className="my-2 bg-sidebar-border/30" />
                )}
                <TooltipProvider delayDuration={0}>
                  {items.map((item) => {
                    const isActive = currentPage === item.page;
                    const button = (
                      <button
                        key={item.page}
                        onClick={() => setPage(item.page)}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-lg text-sm transition-all duration-150",
                          collapsed ? "justify-center p-2.5" : "px-3 py-2",
                          isActive
                            ? "bg-sidebar-primary/15 text-sidebar-primary font-medium"
                            : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        <span className={cn("shrink-0", isActive && "text-sidebar-primary")}>
                          {item.icon}
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                    if (collapsed) {
                      return (
                        <Tooltip key={item.page}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return button;
                  })}
                </TooltipProvider>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse button */}
      <div className="px-2 pb-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={useAppStore.getState().toggleSidebar}
          className={cn(
            "w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
            collapsed ? "justify-center px-2" : "justify-start gap-3 px-3"
          )}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : (
            <>
              <PanelLeftClose size={16} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-sidebar border-r border-sidebar-border/50 transition-all duration-200 ease-out flex flex-col",
        sidebarOpen ? "w-56" : "w-14"
      )}
    >
      <SidebarContent collapsed={!sidebarOpen} />
    </aside>
  );
}
