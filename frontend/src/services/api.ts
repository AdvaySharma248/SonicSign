// ==========================================
// SonicSign - API Service Layer with Firebase Auth
// ==========================================

import { 
  auth, 
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from '@/config/firebase/firebaseClient';
import type { 
  Document, 
  SignRequest, 
  AuditLog, 
  AuditEvent,
  DashboardStats, 
  Activity,
  User 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export interface PdfViewFile {
  url: string;
  httpHeaders: Record<string, string>;
}

function requireFirebaseConfig() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Auth is not configured. Configure Firebase before using authenticated SonicSign data.');
  }
}

function mapUser(raw: any): User {
  const displayName = raw?.displayName || raw?.name || raw?.email?.split('@')[0] || '';
  return {
    id: raw?._id || raw?.id || raw?.uid || raw?.firebaseUid || '',
    uid: raw?.uid || raw?.firebaseUid,
    firebaseUid: raw?.firebaseUid || raw?.uid,
    name: displayName,
    displayName,
    email: raw?.email || '',
    avatar: raw?.avatar || raw?.photoURL || raw?.picture || '',
    photoURL: raw?.photoURL || raw?.avatar || raw?.picture || '',
    role: raw?.role || 'owner',
    organization: raw?.organization,
    preferences: raw?.preferences,
    notificationSettings: raw?.notificationSettings,
  };
}

function mapSigner(raw: any) {
  return {
    id: raw?._id || raw?.id || raw?.email || '',
    name: raw?.name || raw?.email || '',
    email: raw?.email || '',
    status: raw?.status || 'pending',
    signedAt: raw?.signedAt,
    role: raw?.role,
    signingOrder: raw?.signingOrder,
  };
}

function mapDocument(raw: any): Document {
  const owner = raw?.ownerId || raw?.owner || {};
  const ownerName =
    typeof owner === 'string'
      ? owner
      : owner?.name || owner?.displayName || raw?.ownerName || '';

  return {
    id: raw?._id || raw?.id || '',
    name: raw?.name || raw?.title || raw?.fileName || 'Untitled document',
    fileUrl: raw?.fileUrl?.startsWith?.('http') ? raw.fileUrl : raw?.fileUrl ? `${API_ORIGIN}${raw.fileUrl}` : undefined,
    owner: ownerName,
    ownerAvatar: typeof owner === 'object' ? owner?.avatar || owner?.photoURL : raw?.ownerAvatar,
    date: raw?.date || raw?.uploadedAt?.split?.('T')?.[0] || raw?.createdAt?.split?.('T')?.[0] || '',
    status: raw?.status || 'draft',
    size: raw?.size || '',
    pages: raw?.pages || raw?.pageCount || 0,
    signers: (raw?.signers || []).map(mapSigner),
    lastModified: raw?.lastModified || raw?.updatedAt || raw?.createdAt || '',
    thumbnail: raw?.thumbnail,
  };
}

// Helper to fetch with ID token from localStorage or Firebase
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = auth.currentUser
    ? await auth.currentUser.getIdToken()
    : typeof window !== 'undefined'
      ? localStorage.getItem('firebase_id_token')
      : null;
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_id_token', token);
    }
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `API request failed with status ${response.status}`);
    (error as Error & { errors?: unknown }).errors = errorData.errors;
    throw error;
  }

  return response.json();
}

// Auth API
export const authApi = {
  async login(email: string, password: string, rememberMe = false): Promise<User> {
    requireFirebaseConfig();
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (!userCredential.user.emailVerified) {
      await sendEmailVerification(userCredential.user);
      throw new Error('VERIFICATION_REQUIRED');
    }
    
    const idToken = await userCredential.user.getIdToken();
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_id_token', idToken);
    }
    
    const res = await fetchWithAuth('/auth/me');
    return mapUser(res.data.user);
  },

  async register(name: string, email: string, password: string): Promise<User> {
    requireFirebaseConfig();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    
    return {
      id: userCredential.user.uid,
      uid: userCredential.user.uid,
      firebaseUid: userCredential.user.uid,
      name: name,
      displayName: name,
      email: email,
      avatar: userCredential.user.photoURL || '',
      photoURL: userCredential.user.photoURL || '',
      role: 'owner'
    };
  },

  async loginWithGoogle(): Promise<User> {
    requireFirebaseConfig();
    const googleProvider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    const idToken = await userCredential.user.getIdToken();
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_id_token', idToken);
    }
    
    const res = await fetchWithAuth('/auth/me');
    return mapUser(res.data.user);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    requireFirebaseConfig();
    await sendPasswordResetEmail(auth, email);
    return { message: 'Password reset link sent to your email' };
  },

  async getMe(): Promise<User> {
    requireFirebaseConfig();
    const res = await fetchWithAuth('/auth/me');
    return mapUser(res.data.user);
  },

  async updateProfile(updates: Partial<Pick<User, 'name' | 'displayName' | 'email' | 'avatar' | 'photoURL' | 'organization' | 'preferences' | 'notificationSettings'>>): Promise<User> {
    const res = await fetchWithAuth('/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return mapUser(res.data.user);
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('firebase_id_token');
    }
  }
};

// Documents API
export const documentsApi = {
  async getAll(): Promise<Document[]> {
    const res = await fetchWithAuth('/documents');
    return (res.data.documents || []).map(mapDocument);
  },

  async getById(id: string): Promise<Document | undefined> {
    const res = await fetchWithAuth(`/documents/${id}`);
    return res.data.document ? mapDocument(res.data.document) : undefined;
  },

  async upload(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', file.name.replace('.pdf', ''));
    
    const res = await fetchWithAuth('/documents/upload', {
      method: 'POST',
      body: formData,
    });
    return mapDocument(res.data.document);
  },

  async getViewFile(id: string): Promise<PdfViewFile> {
    const token = auth.currentUser
      ? await auth.currentUser.getIdToken()
      : typeof window !== 'undefined'
        ? localStorage.getItem('firebase_id_token')
        : null;
    const url = `${API_BASE_URL}/documents/${id}/view`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok || !contentType.toLowerCase().includes('application/pdf')) {
      throw new Error('PDF file is unavailable');
    }

    return {
      url,
      httpHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },

  async download(id: string, fileName: string): Promise<void> {
    const token = auth.currentUser
      ? await auth.currentUser.getIdToken()
      : typeof window !== 'undefined'
        ? localStorage.getItem('firebase_id_token')
        : null;
    const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error('Unable to download PDF');
    }

    const file = URL.createObjectURL(await response.blob());
    const link = window.document.createElement('a');
    link.href = file;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    link.click();
    URL.revokeObjectURL(file);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth(`/documents/${id}`, {
      method: 'DELETE',
    });
    return { success: res.success };
  },
};

// Signatures API
export const signaturesApi = {
  async addSigner(documentId: string, signer: { name: string; email: string; role?: string; signingOrder?: number; isOwner?: boolean }) {
    const res = await fetchWithAuth('/signers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId, ...signer }) });
    return mapSigner(res.data.signer);
  },
  async getFields(documentId: string) {
    const res = await fetchWithAuth(`/signatures/fields/${documentId}`);
    return res.data.fields || [];
  },
  async saveFields(documentId: string, fields: any[]) {
    const res = await fetchWithAuth(`/signatures/fields/${documentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
    return res.data.fields || [];
  },
  async sendDocument(documentId: string) {
    const res = await fetchWithAuth(`/signers/documents/${documentId}/send`, { method: 'POST' });
    return res.data;
  },
  async requestSignature(documentId: string, email: string, message?: string): Promise<SignRequest> {
    const res = await fetchWithAuth('/signature-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, email, name: email.split('@')[0], message }),
    });
    const signer = res.data.signer;
    return {
      id: signer._id || signer.id,
      documentName: signer.documentId?.title || signer.documentId?.name || '',
      recipientEmail: signer.email,
      recipientName: signer.name,
      status: signer.status,
      sentDate: signer.createdAt ? signer.createdAt.split('T')[0] : '',
      message: signer.message || message,
    };
  },

  async getRequests(): Promise<SignRequest[]> {
    const res = await fetchWithAuth('/signers/mine');
    return (res.data.signers || []).map((s: any) => ({
      id: s._id || s.id,
      documentName: s.documentId?.title || s.documentId?.name || '',
      recipientEmail: s.email,
      recipientName: s.name,
      status: s.status,
      sentDate: s.createdAt ? s.createdAt.split('T')[0] : '',
      completedDate: s.signedAt ? s.signedAt.split('T')[0] : undefined,
      message: s.message,
    }));
  },

  async finalize(documentId: string): Promise<{ success: boolean }> {
    const res = await fetchWithAuth('/signatures/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    });
    return { success: res.success };
  },
};

async function fetchPublic(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `API request failed with status ${response.status}`);
    (error as Error & { errors?: unknown }).errors = errorData.errors;
    throw error;
  }
  return response.json();
}

export const publicSigningApi = {
  pdfUrl(token: string) {
    return `${API_BASE_URL}/public/sign/${token}/pdf`;
  },
  async getSession(token: string) {
    const res = await fetchPublic(`/public/sign/${token}/session`);
    return res.data;
  },
  async complete(token: string, values: Array<{ fieldId: string; value: string; signatureMethod?: 'draw' | 'type' | 'upload' }>) {
    const res = await fetchPublic(`/public/sign/${token}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    return res.data;
  },
};

const mapEventToFrontend = (backendAction: string): AuditEvent => {
  switch (backendAction) {
    case 'USER_LOGIN': return 'user.login';
    case 'DOCUMENT_UPLOADED': return 'document.uploaded';
    case 'DOCUMENT_VIEWED': return 'document.viewed';
    case 'DOCUMENT_DOWNLOADED': return 'document.downloaded';
    case 'DOCUMENT_DELETED': return 'document.deleted';
    case 'SIGNER_ADDED': return 'signature.requested';
    case 'SIGNING_REQUEST_SENT': return 'signature.requested';
    case 'EMAIL_QUEUED': return 'email.queued';
    case 'EMAIL_DELIVERED': return 'email.delivered';
    case 'EMAIL_FAILED': return 'email.failed';
    case 'FIELD_COMPLETED': return 'field.completed';
    case 'SIGNATURE_SUBMITTED': return 'signature.completed';
    case 'DOCUMENT_FINALIZED': return 'document.finalized';
    case 'SIGNATURE_ADDED': return 'signature.completed';
    case 'DOCUMENT_SIGNED': return 'document.signed';
    case 'DOCUMENT_REJECTED': return 'document.rejected';
    default: return 'settings.updated';
  }
};

// Audit API
export const auditApi = {
  async getLogs(filters?: { event?: string; user?: string; dateFrom?: string; dateTo?: string }): Promise<AuditLog[]> {
    const queryParams = new URLSearchParams();
    if (filters?.event) {
      // Map frontend event type to backend action key if filtering
      const backendFilterMap: Record<string, string> = {
        'user.login': 'USER_LOGIN',
        'document.uploaded': 'DOCUMENT_UPLOADED',
        'document.viewed': 'DOCUMENT_VIEWED',
        'document.downloaded': 'DOCUMENT_DOWNLOADED',
        'signature.requested': 'SIGNER_ADDED',
        'signature.completed': 'SIGNATURE_ADDED',
        'email.queued': 'EMAIL_QUEUED',
        'email.delivered': 'EMAIL_DELIVERED',
        'email.failed': 'EMAIL_FAILED',
        'field.completed': 'FIELD_COMPLETED',
        'document.finalized': 'DOCUMENT_FINALIZED',
        'document.signed': 'DOCUMENT_SIGNED',
        'document.rejected': 'DOCUMENT_REJECTED'
      };
      const mapped = backendFilterMap[filters.event];
      if (mapped) queryParams.append('action', mapped);
    }
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters?.user) queryParams.append('user', filters.user);
    
    const res = await fetchWithAuth(`/audit?${queryParams.toString()}`);
    return (res.data.auditLogs || []).map((log: any) => ({
      id: log._id || log.id,
      event: mapEventToFrontend(log.action),
      user: log.userId?.name || log.userId?.email || '',
      userEmail: log.userId?.email || '',
      timestamp: log.createdAt || '',
      ipAddress: log.ipAddress || '',
      details: log.description || '',
      resource: log.documentId?.name || log.documentId?.title || '',
    }));
  },

  async getByDocumentId(documentId: string): Promise<AuditLog[]> {
    const res = await fetchWithAuth(`/audit/${documentId}`);
    return (res.data.auditLogs || []).map((log: any) => ({
      id: log._id || log.id,
      event: mapEventToFrontend(log.action),
      user: log.userId?.name || log.userId?.email || '',
      userEmail: log.userId?.email || '',
      timestamp: log.createdAt || '',
      ipAddress: log.ipAddress || '',
      details: log.description || '',
      resource: log.documentId?.name || log.documentId?.title || '',
    }));
  },
};

// Dashboard API
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await fetchWithAuth('/dashboard/summary');
    return res.data.stats;
  },

  async getRecentDocuments(): Promise<Document[]> {
    const res = await fetchWithAuth('/dashboard/summary');
    return (res.data.recentDocuments || []).map(mapDocument);
  },

  async getPendingSignatures(): Promise<Document[]> {
    const res = await fetchWithAuth('/dashboard/summary');
    return (res.data.pendingDocuments || []).map(mapDocument);
  },

  async getActivities(): Promise<Activity[]> {
    const res = await fetchWithAuth('/dashboard/summary');
    return res.data.recentActivities;
  },
};
