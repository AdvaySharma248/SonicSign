// ==========================================
// SonicSign - Mock API Service Layer
// ==========================================

import type { 
  Document, 
  SignRequest, 
  AuditLog, 
  DashboardStats, 
  Activity,
  User 
} from '@/types';
import { 
  mockDocuments, 
  mockSignRequests, 
  mockAuditLogs, 
  mockStats, 
  mockActivities,
  mockUser 
} from '@/data/mock';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<User> {
    await delay(800);
    if (email && password) {
      return { ...mockUser, email };
    }
    throw new Error('Invalid credentials');
  },

  async register(name: string, email: string, password: string): Promise<User> {
    await delay(1000);
    return { ...mockUser, name, email };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    await delay(600);
    return { message: 'Password reset link sent to your email' };
  },
};

// Documents API
export const documentsApi = {
  async getAll(): Promise<Document[]> {
    await delay(500);
    return mockDocuments;
  },

  async getById(id: string): Promise<Document | undefined> {
    await delay(400);
    return mockDocuments.find(doc => doc.id === id);
  },

  async upload(file: File): Promise<Document> {
    await delay(2000);
    return {
      id: `doc_${Date.now()}`,
      name: file.name,
      owner: 'Alex Chen',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      pages: Math.ceil(Math.random() * 20),
      lastModified: 'Just now',
      signers: [],
    };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    await delay(300);
    return { success: true };
  },
};

// Signatures API
export const signaturesApi = {
  async requestSignature(documentId: string, email: string, message?: string): Promise<SignRequest> {
    await delay(600);
    return {
      id: `req_${Date.now()}`,
      documentName: mockDocuments.find(d => d.id === documentId)?.name || 'Unknown',
      recipientEmail: email,
      recipientName: email.split('@')[0],
      status: 'sent',
      sentDate: new Date().toISOString().split('T')[0],
      message,
    };
  },

  async getRequests(): Promise<SignRequest[]> {
    await delay(500);
    return mockSignRequests;
  },

  async finalize(documentId: string): Promise<{ success: boolean }> {
    await delay(800);
    return { success: true };
  },
};

// Audit API
export const auditApi = {
  async getLogs(filters?: { event?: string; user?: string; dateFrom?: string; dateTo?: string }): Promise<AuditLog[]> {
    await delay(500);
    let logs = [...mockAuditLogs];
    if (filters?.event) {
      logs = logs.filter(log => log.event === filters.event);
    }
    if (filters?.user) {
      logs = logs.filter(log => log.user.toLowerCase().includes(filters.user!.toLowerCase()));
    }
    return logs;
  },

  async getByDocumentId(documentId: string): Promise<AuditLog[]> {
    await delay(400);
    return mockAuditLogs.filter(log => log.resource === documentId);
  },
};

// Dashboard API
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    await delay(400);
    return mockStats;
  },

  async getRecentDocuments(): Promise<Document[]> {
    await delay(500);
    return mockDocuments.slice(0, 5);
  },

  async getPendingSignatures(): Promise<Document[]> {
    await delay(400);
    return mockDocuments.filter(doc => doc.status === 'pending');
  },

  async getActivities(): Promise<Activity[]> {
    await delay(400);
    return mockActivities;
  },
};
