import { create } from 'zustand';

export type Page =
  | 'dashboard'
  | 'hostel-blocks'
  | 'rooms'
  | 'students'
  | 'sockets'
  | 'power-events'
  | 'load-rules'
  | 'wardens'
  | 'violations'
  | 'fines'
  | 'terminal';

interface AppState {
  currentPage: Page;
  sidebarOpen: boolean;
  setPage: (page: Page) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: true,
  setPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
