'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { auth, sendEmailVerification, signOut } from '@/config/firebase/firebaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function VerifyEmailCard() {
  const { setAuthView } = useAppStore();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  
  const currentUser = auth?.currentUser;

  const handleResend = async () => {
    if (!currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!currentUser) return;
    setChecking(true);
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        toast.success('Email verified successfully! Logging you in...');
        // The onAuthStateChanged listener in page.tsx will trigger automatically
      } else {
        toast.error('Email is not verified yet. Please check your inbox.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error checking verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleBackToSignIn = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setAuthView('sign-in');
    } catch (error) {
      console.error(error);
      setAuthView('sign-in');
    }
  };

  return (
    <div className="flex flex-col text-center">
      {/* Icon */}
      <div className="mx-auto w-14 h-14 rounded-[16px] bg-[#EEF2FF] border border-[#365CF5]/10 flex items-center justify-center mb-6">
        <Mail className="w-6 h-6 text-[#365CF5]" />
      </div>

      {/* Header */}
      <h2 className="text-3xl font-heading text-[#111827] tracking-tight">
        Verify your email
      </h2>
      <p className="mt-2 text-[#6B7280] text-sm leading-relaxed max-w-[320px] mx-auto">
        We sent a verification link to <span className="text-[#111827] font-semibold">{currentUser?.email || 'your email'}</span>.
      </p>

      {/* Actions */}
      <div className="mt-8 space-y-3">
        <Button
          type="button"
          onClick={handleCheckVerification}
          disabled={checking}
          asChild
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="premium-button w-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>I have verified my email</span>
          </motion.button>
        </Button>

        <Button
          type="button"
          onClick={handleResend}
          disabled={resending}
          variant="outline"
          className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer h-11"
        >
          {resending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Resend verification email</span>
        </Button>
      </div>

      {/* Back to sign in */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleBackToSignIn}
          className="flex items-center justify-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827] font-semibold transition-colors mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </button>
      </div>
    </div>
  );
}
