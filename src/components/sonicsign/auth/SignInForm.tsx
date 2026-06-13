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
      const user = await authApi.login(data.email, data.password);
      setIsAuthenticated(true);
      setUser(user);
      setCurrentPage('dashboard');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Invalid email or password. Please try again.'
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        custom={0}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-2xl text-page-title text-[#111827]">
          Welcome back
        </h2>
        <p className="mt-1.5 text-[#6B7280] text-sm text-body">
          Sign in to your SonicSign account
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
        {/* Email */}
        <motion.div
          custom={1}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <Label htmlFor="email" className="text-[#111827] text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
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

        {/* Password */}
        <motion.div
          custom={2}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[#111827] text-sm font-medium">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setAuthView('forgot-password')}
              className="text-xs text-[#365CF5] hover:text-[#2a4fd4] font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={cn(
                'h-10 rounded-lg border-[#E5E7EB] bg-white pr-10',
                'placeholder:text-[#9CA3AF]',
                'focus-visible:border-[#365CF5] focus-visible:ring-[#365CF5]/20',
                errors.password && 'border-[#EF4444] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]/20'
              )}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-[#EF4444]">{errors.password.message}</p>
          )}
        </motion.div>

        {/* Remember me */}
        <motion.div
          custom={3}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2.5"
        >
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setValue('rememberMe', checked === true)}
            className="data-[state=checked]:bg-[#365CF5] data-[state=checked]:border-[#365CF5]"
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm text-[#6B7280] font-normal cursor-pointer"
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
          className="pt-2"
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full h-10 rounded-lg text-sm font-medium text-button',
              'bg-[#365CF5] hover:bg-[#2a4fd4]',
              'transition-all duration-200',
              'disabled:opacity-60'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </motion.div>
      </form>

      {/* Sign up link */}
      <motion.div
        custom={5}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 text-center"
      >
        <p className="text-sm text-[#6B7280]">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthView('sign-up')}
            className="text-[#365CF5] hover:text-[#2a4fd4] font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </motion.div>
    </div>
  );
}
