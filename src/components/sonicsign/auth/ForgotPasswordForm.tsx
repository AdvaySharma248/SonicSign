'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function ForgotPasswordForm() {
  const { setAuthView } = useAppStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError('');
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Back link */}
            <motion.div
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <button
                type="button"
                onClick={() => setAuthView('sign-in')}
                className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </motion.div>

            {/* Header */}
            <motion.div
              custom={1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-semibold text-[#111827] tracking-tight">
                Reset your password
              </h2>
              <p className="mt-1.5 text-[#6B7280] text-sm">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </motion.div>

            {/* Error message */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200"
              >
                <p className="text-sm text-[#EF4444]">{serverError}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <motion.div
                custom={2}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="space-y-1.5"
              >
                <Label htmlFor="forgot-email" className="text-[#111827] text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={cn(
                    'h-10 rounded-lg border-[#E5E7EB] bg-white',
                    'placeholder:text-[#9CA3AF]',
                    'focus-visible:border-[#365CF5] focus-visible:ring-[#365CF5]/20',
                    errors.email && 'border-[#EF4444] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]/20'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-[#EF4444]">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div
                custom={3}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="pt-2"
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full h-10 rounded-lg text-sm font-medium',
                    'bg-[#365CF5] hover:bg-[#2a4fd4]',
                    'transition-all duration-200',
                    'disabled:opacity-60'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Success state */}
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-[#365CF5]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#111827] tracking-tight">
                Check your email
              </h2>
              <p className="mt-2 text-[#6B7280] text-sm leading-relaxed max-w-[280px] mx-auto">
                We&apos;ve sent a password reset link to{' '}
                <span className="text-[#111827] font-medium">{submittedEmail}</span>
              </p>
              <p className="mt-4 text-[#6B7280] text-xs">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="text-[#365CF5] hover:text-[#2a4fd4] font-medium transition-colors"
                >
                  try another email
                </button>
              </p>

              <div className="mt-8">
                <Button
                  type="button"
                  onClick={() => setAuthView('sign-in')}
                  variant="outline"
                  className={cn(
                    'h-10 rounded-lg text-sm font-medium',
                    'border-[#E5E7EB] hover:bg-[#F9FAFB] hover:text-[#111827]',
                    'transition-all duration-200'
                  )}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
