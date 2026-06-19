// ==========================================
// SonicSign - Type Definitions
// ==========================================

// Navigation
export type PageRoute = 
  | 'auth'
  | 'dashboard' 
  | 'documents' 
  | 'sign-requests' 
  | 'audit-logs' 
  | 'settings'
  | 'upload'
  | 'document-details'
  | 'signature-placement';

export type AuthView = 'sign-in' | 'sign-up' | 'forgot-password' | 'verify-email';

// Document
export type DocumentStatus = 'pending' | 'signed' | 'partially_signed' | 'completed' | 'rejected' | 'draft' | 'expired' | 'viewed' | 'archived';

export interface Document {
  id: string;
  name: string;
  fileUrl?: string;
  owner: string;
  ownerAvatar?: string;
  date: string;
  status: DocumentStatus;
  size: string;
  pages: number;
  signers: Signer[];
  lastModified: string;
  thumbnail?: string;
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'signed' | 'rejected' | 'viewed' | 'expired';
  signedAt?: string;
  emailDelivery?: {
    status: 'queued' | 'processing' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'rejected';
    sentAt: string;
    deliveredAt?: string;
    errorMessage?: string;
    retryCount?: number;
  };
}

// Signature Request
export type RequestStatus = 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired';

export interface SignRequest {
  id: string;
  documentName: string;
  recipientEmail: string;
  recipientName: string;
  status: RequestStatus;
  sentDate: string;
  completedDate?: string;
  message?: string;
}

// Audit Log
export type AuditEvent = 
  | 'document.uploaded' 
  | 'document.viewed' 
  | 'document.signed' 
  | 'document.rejected'
  | 'document.deleted'
  | 'document.downloaded'
  | 'signature.requested'
  | 'signature.completed'
  | 'email.queued'
  | 'email.delivered'
  | 'email.failed'
  | 'field.completed'
  | 'document.finalized'
  | 'user.login'
  | 'user.logout'
  | 'settings.updated';

export interface AuditLog {
  id: string;
  event: AuditEvent;
  user: string;
  userEmail: string;
  timestamp: string;
  ipAddress: string;
  details: string;
  resource?: string;
}

// Stats
export interface DashboardStats {
  totalDocuments: number;
  pending: number;
  signed: number;
  rejected: number;
  draft: number;
  viewed: number;
  expired: number;
  archived: number;
}

// Activity
export interface Activity {
  id: string;
  type: 'upload' | 'sign' | 'reject' | 'request' | 'view' | 'login' | 'logout' | 'delete' | 'download' | 'update';
  user: string;
  action: string;
  target: string;
  timestamp: string;
  avatar?: string;
}

// Signature Placement
export interface SignaturePlacement {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerEmail: string;
  signerName: string;
  signerId?: string;
  type: 'signature' | 'initials' | 'date' | 'text';
}

// User
export interface User {
  id: string;
  uid?: string;
  firebaseUid?: string;
  name: string;
  displayName?: string;
  email: string;
  avatar?: string;
  photoURL?: string;
  role: 'admin' | 'owner' | 'signer';
  organization?: string;
  preferences?: AppearanceSettings;
  notificationSettings?: NotificationSettings;
}

// Upload
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  file?: File;
  error?: string;
  documentId?: string;
}

// Settings
export interface NotificationSettings {
  emailOnSignature: boolean;
  emailOnRejection: boolean;
  emailOnExpiry: boolean;
  weeklyDigest: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}
