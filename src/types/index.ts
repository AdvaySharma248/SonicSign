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

export type AuthView = 'sign-in' | 'sign-up' | 'forgot-password';

// Document
export type DocumentStatus = 'pending' | 'signed' | 'rejected' | 'draft' | 'expired';

export interface Document {
  id: string;
  name: string;
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
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
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
}

// Activity
export interface Activity {
  id: string;
  type: 'upload' | 'sign' | 'reject' | 'request' | 'view';
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
  type: 'signature' | 'initials' | 'date' | 'text';
}

// User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  organization?: string;
}

// Upload
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
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
