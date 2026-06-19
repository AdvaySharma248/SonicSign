'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { authApi } from '@/services/api';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
};

export function SignInForm() {
  const { setAuthView, setIsAuthenticated, setUser, setCurrentPage } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: SignInFormData) => {
    setServerError('');
    try {
      const user = await authApi.login(data.email, data.password, !!data.rememberMe);
      setIsAuthenticated(true);
      setUser(user);
      setCurrentPage('dashboard');
    } catch (err: any) {
      if (err.message === 'VERIFICATION_REQUIRED') {
        setAuthView('verify-email');
      } else {
        setServerError(getAuthErrorMessage(err));
      }
    }
  };

  const handleGoogleSignIn = async () => {
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

      {/* Google login button */}
      <motion.div
        custom={0}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="mb-1"
      >
        <button
          type="button"
          onClick={handleGoogleSignIn}
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
          <span>Continue with Google</span>
        </button>
      </motion.div>

      {/* Divider */}
      <motion.div
        custom={0.5}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3 my-3 select-none"
      >
        <div className="h-px bg-gray-100/80 flex-1" />
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">or email</span>
        <div className="h-px bg-gray-100/80 flex-1" />
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Email */}
        <motion.div
          custom={1}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          <Label htmlFor="email" className="text-[#111827] text-[11px] font-bold uppercase tracking-wider">
            Email
          </Label>
          <motion.div whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
            <Input
              id="email"
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
        </motion.div>

        {/* Password */}
        <motion.div
          custom={2}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[#111827] text-[11px] font-bold uppercase tracking-wider">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setAuthView('forgot-password')}
              className="text-[11px] text-[#6B7280] hover:text-[#111827] font-semibold transition-colors outline-none"
            >
              Forgot password?
            </button>
          </div>
          <motion.div className="relative" whileHover={{ y: -0.5 }} transition={{ duration: 0.2 }}>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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
        </motion.div>

        {/* Remember me */}
        <motion.div
          custom={3}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 pt-0.5"
        >
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
            className="data-[state=checked]:bg-[#365CF5] data-[state=checked]:border-[#365CF5] rounded-md w-4.5 h-4.5 border-[#E5E7EB]"
          />
          <Label
            htmlFor="rememberMe"
            className="text-xs text-[#6B7280] font-medium cursor-pointer select-none"
          >
            Remember me for 30 days
          </Label>
        </motion.div>

        {/* Submit */}
        <motion.div
          custom={4}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="pt-1"
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </motion.button>
          </Button>
        </motion.div>
      </form>

      {/* Switch Link */}
      <motion.div
        custom={5}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 text-center"
      >
        <p className="text-xs text-[#6B7280]">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthView('sign-up')}
            className="text-[#365CF5] hover:text-[#2a4fd4] font-semibold transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
