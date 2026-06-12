'use client';

import { useAppStore } from '@/store/useAppStore';
import { AuthLayout } from './AuthLayout';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

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
