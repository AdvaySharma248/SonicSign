'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AppLayout } from '@/components/sonicsign/layout/AppLayout';
import { AuthPage } from '@/components/sonicsign/auth/AuthPage';
import dynamic from 'next/dynamic';

const DashboardPage = dynamic(() => import('@/components/sonicsign/dashboard/DashboardPage'), { ssr: false });
const DocumentsPage = dynamic(() => import('@/components/sonicsign/documents/DocumentsPage'), { ssr: false });
const UploadPage = dynamic(() => import('@/components/sonicsign/upload/UploadPage'), { ssr: false });
const DocumentDetailsPage = dynamic(() => import('@/components/sonicsign/document-details/DocumentDetailsPage'), { ssr: false });
const SignaturePlacementPage = dynamic(() => import('@/components/sonicsign/signature/SignaturePlacementPage'), { ssr: false });
const SignRequestsPage = dynamic(() => import('@/components/sonicsign/sign-requests/SignRequestsPage'), { ssr: false });
const AuditLogsPage = dynamic(() => import('@/components/sonicsign/audit/AuditLogsPage'), { ssr: false });
const SettingsPage = dynamic(() => import('@/components/sonicsign/settings/SettingsPage'), { ssr: false });
import { auth, isFirebaseConfigured, onAuthStateChanged } from '@/config/firebase/firebaseClient';
import { authApi } from '@/services/api';
import { Loader2 } from 'lucide-react';

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
  const { isAuthenticated, setIsAuthenticated, setUser, setAuthView, setCurrentPage } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Check if email is verified
          if (!firebaseUser.emailVerified) {
            // Unverified user: enforce verification
            setIsAuthenticated(false);
            setUser(null);
            setAuthView('verify-email');
            setCurrentPage('auth');
          } else {
            // Verified: Retrieve and store ID Token
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('firebase_id_token', token);
            
            // Sync user profile from backend
            const profile = await authApi.getMe();
            setUser(profile);
            setIsAuthenticated(true);
            setCurrentPage('dashboard');
          }
        } catch (error) {
          console.error('Failed to sync auth user profile:', error);
          setIsAuthenticated(false);
          setUser(null);
          setAuthView('sign-in');
          setCurrentPage('auth');
        }
      } else {
        // User logged out
        localStorage.removeItem('firebase_id_token');
        setIsAuthenticated(false);
        setUser(null);
        setAuthView('sign-in');
        setCurrentPage('auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setIsAuthenticated, setUser, setAuthView, setCurrentPage]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-premium-noise">
        <Loader2 className="w-8 h-8 animate-spin text-[#365CF5] mb-2" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading SonicSign...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AuthenticatedApp />;
}
