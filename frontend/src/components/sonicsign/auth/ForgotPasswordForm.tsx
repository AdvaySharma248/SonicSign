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
import { getAuthErrorMessage } from '@/lib/authErrors';
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
      duration: 0.45,
      ease: 'easeOut' as const,
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
      setServerError(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col">
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
              className="flex justify-center"
            >
              <button
                type="button"
                onClick={() => setAuthView('sign-in')}
                className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] font-semibold transition-colors mb-6"
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
              className="text-center"
            >
              <h2 className="text-3xl font-heading text-[#111827] tracking-tight">
                Reset Password
              </h2>
              <p className="mt-2 text-[#6B7280] text-sm text-body">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </motion.div>

            {/* Error message */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-xl bg-red-50/80 border border-red-100"
              >
                <p className="text-sm text-red-600 font-medium text-center">{serverError}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              {/* Email */}
              <motion.div
                custom={2}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                className="space-y-1.5"
              >
                <Label htmlFor="forgot-email" className="text-[#111827] text-xs font-semibold uppercase tracking-wider">
                  Email address
                </Label>
                <motion.div whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    className={cn(
                      'premium-input w-full',
                      errors.email && 'border-red-500/80 focus-visible:ring-red-500/10'
                    )}
                    {...register('email')}
                  />
                </motion.div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.email.message}</p>
                )}
              </motion.div>

              {/* Submit */}
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
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="premium-button w-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending link...</span>
                      </>
                    ) : (
                      <span>Send reset link</span>
                    )}
                  </motion.button>
                </Button>
              </motion.div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' as const }}
            className="text-center"
          >
            {/* Success state */}
            <div className="mx-auto w-14 h-14 rounded-[16px] bg-[#EEF2FF] border border-[#365CF5]/10 flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-[#365CF5]" />
            </div>
            <h2 className="text-3xl font-heading text-[#111827] tracking-tight">
              Check your email
            </h2>
            <p className="mt-3 text-[#6B7280] text-sm leading-relaxed text-body max-w-[320px] mx-auto">
              We&apos;ve sent a password reset link to{' '}
              <span className="text-[#111827] font-semibold">{submittedEmail}</span>
            </p>
            <p className="mt-5 text-[#6B7280] text-xs">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="text-[#365CF5] hover:text-[#2a4fd4] font-semibold transition-colors"
              >
                try another email
              </button>
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                onClick={() => setAuthView('sign-in')}
                asChild
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="premium-button w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to sign in</span>
                </motion.button>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
