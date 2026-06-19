'use client';

import { useAppStore } from '@/store/useAppStore';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { VerifyEmailCard } from './VerifyEmailCard';

export function AuthPage() {
  const { authView } = useAppStore();

  const renderForm = () => {
    switch (authView) {
      case 'sign-in':
        return <SignInForm />;
      case 'sign-up':
        return <SignUpForm />;
      case 'forgot-password':
        return <ForgotPasswordForm />;
      case 'verify-email':
        return <VerifyEmailCard />;
      default:
        return <SignInForm />;
    }
  };

  return (
    <AuthLayout authViewKey={authView}>
      {renderForm()}
    </AuthLayout>
  );
}
