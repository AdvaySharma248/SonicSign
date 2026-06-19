'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { authApi } from '@/services/api';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z.literal(true, {
      message: 'You must agree to the terms of service',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { setAuthView, setIsAuthenticated, setUser, setCurrentPage } = useAppStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: undefined as unknown as true,
    },
  });

  const agreeToTerms = watch('agreeToTerms');

  const onSubmit = async (data: SignUpFormData) => {
    setServerError('');
    try {
      await authApi.register(data.name, data.email, data.password);
      setAuthView('verify-email');
    } catch (err) {
      setServerError(getAuthErrorMessage(err));
    }
  };

  const handleGoogleSignUp = async () => {
    setServerError('');
    try {
      const user = await authApi.loginWithGoogle();
      setIsAuthenticated(true);
      setUser(user);
      setCurrentPage('dashboard');
    } catch (err: any) {
      setServerError(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col">
      {/* Error message */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100"
        >
          <p className="text-xs text-red-600 font-medium text-center">{serverError}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' as const }}
              className="space-y-3"
            >
              {/* Google signup button */}
              <div className="mb-1">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="w-full flex items-center justify-center gap-2.5 h-10 px-4 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50/80 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer outline-none"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.72 5.72 0 0 1-2.48 3.75v3.12h4.01c2.34-2.15 3.69-5.32 3.69-8.72z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.12c-1.12.75-2.54 1.19-3.95 1.19-3.04 0-5.62-2.05-6.54-4.81H1.31v3.22A12.002 12.002 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.46 14.35a7.16 7.16 0 0 1 0-4.7v-3.22H1.31a12.002 12.002 0 0 0 0 11.14l4.15-3.22z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.96 11.96 0 0 0 12 0 12.002 12.002 0 0 0 1.31 6.43l4.15 3.22c.92-2.76 3.5-4.81 6.54-4.81z"
                    />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3 select-none">
                <div className="h-px bg-gray-100/80 flex-1" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">or email</span>
                <div className="h-px bg-gray-100/80 flex-1" />
              </div>

              {/* Email */}
              <div className="space-y-0.5">
                <Label htmlFor="signup-email" className="text-[#111827] text-[11px] font-bold uppercase tracking-wider">
                  Email
                </Label>
                <motion.div whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
                  <Input
                    id="signup-email"
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
                  <p className="text-xs text-red-500 mt-0.5 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-0.5">
                <Label htmlFor="signup-password" className="text-[#111827] text-[11px] font-bold uppercase tracking-wider">
                  Password
                </Label>
                <motion.div className="relative" whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn(
                      'premium-input w-full pr-12',
                      errors.password && 'border-red-500/80 focus-visible:ring-red-500/10'
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </motion.div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-0.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Continue Button */}
              <div className="pt-1.5">
                <Button
                  type="button"
                  onClick={async () => {
                    const isValid = await trigger(['email', 'password']);
                    if (isValid) {
                      setStep(2);
                    }
                  }}
                  className="w-full cursor-pointer"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="premium-button w-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                  </motion.button>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' as const }}
              className="space-y-3"
            >
              {/* Full Name */}
              <div className="space-y-0.5">
                <Label htmlFor="name" className="text-[#111827] text-[11px] font-bold uppercase tracking-wider">
                  Full name
                </Label>
                <motion.div whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    className={cn(
                      'premium-input w-full',
                      errors.name && 'border-red-500/80 focus-visible:ring-red-500/10'
                    )}
                    {...register('name')}
                  />
                </motion.div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-0.5 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-0.5">
                <Label htmlFor="confirmPassword" className="text-[#111827] text-[11px] font-bold uppercase tracking-wider">
                  Confirm password
                </Label>
                <motion.div className="relative" whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={cn(
                      'premium-input w-full pr-12',
                      errors.confirmPassword && 'border-red-500/80 focus-visible:ring-red-500/10'
                    )}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </motion.div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-0.5 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreeToTerms ?? false}
                  onCheckedChange={(checked) => setValue('agreeToTerms', (checked ?? false) as true)}
                  className={cn(
                    'mt-0.5 rounded-md w-4.5 h-4.5 border-[#E5E7EB]',
                    'data-[state=checked]:bg-[#365CF5] data-[state=checked]:border-[#365CF5]',
                    errors.agreeToTerms && 'border-red-500'
                  )}
                />
                <Label
                  htmlFor="agreeToTerms"
                  className="text-xs text-[#6B7280] font-medium leading-snug cursor-pointer select-none"
                >
                  I agree to the{' '}
                  <span className="text-[#365CF5] hover:underline font-semibold cursor-pointer">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-[#365CF5] hover:underline font-semibold cursor-pointer">
                    Privacy Policy
                  </span>
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-xs text-red-500 mt-0.5 font-medium">{errors.agreeToTerms.message}</p>
              )}

              {/* Create Account Submit Button */}
              <div className="pt-1.5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full cursor-pointer"
                  asChild
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="premium-button w-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </motion.button>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Switch / Back Links */}
      <div className="mt-4">
        {step === 1 ? (
          <div className="text-center">
            <p className="text-xs text-[#6B7280]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('sign-in')}
                className="text-[#365CF5] hover:text-[#2a4fd4] font-semibold transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#6B7280] hover:text-[#111827] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              ← Back to step 1
            </button>
            <button
              type="button"
              onClick={() => setAuthView('sign-in')}
              className="text-[#365CF5] hover:text-[#2a4fd4] font-semibold transition-colors cursor-pointer"
            >
              Sign In instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
