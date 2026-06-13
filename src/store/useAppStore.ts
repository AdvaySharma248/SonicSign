import { create } from 'zustand';
import type { PageRoute, AuthView, User } from '@/types';

interface AppState {
  // Navigation
  currentPage: PageRoute;
  previousPage: PageRoute | null;
  setCurrentPage: (page: PageRoute) => void;
  
  // Auth
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Document context
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Modal
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (modal: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // View mode
  documentViewMode: 'grid' | 'list';
  setDocumentViewMode: (mode: 'grid' | 'list') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentPage: 'auth',
  previousPage: null,
  setCurrentPage: (page) => set((state) => ({ 
    previousPage: state.currentPage, 
    currentPage: page 
  })),
  
  // Auth
  authView: 'sign-in',
  setAuthView: (view) => set({ authView: view }),
  isAuthenticated: false,
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  user: null,
  setUser: (user) => set({ user }),
  
  // Document context
  selectedDocumentId: null,
  setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),
  
  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modal
  activeModal: null,
  modalData: {},
  openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),
  
  // View mode
  documentViewMode: 'grid',
  setDocumentViewMode: (mode) => set({ documentViewMode: mode }),
}));
