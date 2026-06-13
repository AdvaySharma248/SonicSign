'use client';

import { useAppStore } from '@/store/useAppStore';
import { AppLayout } from '@/components/sonicsign/layout/AppLayout';
import { AuthPage } from '@/components/sonicsign/auth/AuthPage';
import DashboardPage from '@/components/sonicsign/dashboard/DashboardPage';
import DocumentsPage from '@/components/sonicsign/documents/DocumentsPage';
import UploadPage from '@/components/sonicsign/upload/UploadPage';
import DocumentDetailsPage from '@/components/sonicsign/document-details/DocumentDetailsPage';
import SignaturePlacementPage from '@/components/sonicsign/signature/SignaturePlacementPage';
import SignRequestsPage from '@/components/sonicsign/sign-requests/SignRequestsPage';
import AuditLogsPage from '@/components/sonicsign/audit/AuditLogsPage';
import SettingsPage from '@/components/sonicsign/settings/SettingsPage';

function AuthenticatedApp() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'upload':
        return <UploadPage />;
      case 'document-details':
        return <DocumentDetailsPage />;
      case 'signature-placement':
        return <SignaturePlacementPage />;
      case 'sign-requests':
        return <SignRequestsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
}

export default function Home() {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AuthenticatedApp />;
}
