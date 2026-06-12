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

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function SignUpForm() {
  const { setAuthView, setIsAuthenticated, setUser, setCurrentPage } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      const user = await authApi.register(data.name, data.email, data.password);
      setIsAuthenticated(true);
      setUser(user);
      setCurrentPage('dashboard');
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
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
        <h2 className="text-2xl font-semibold text-[#111827] tracking-tight">
          Create your account
        </h2>
        <p className="mt-1.5 text-[#6B7280] text-sm">
          Get started with SonicSign for free
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
        {/* Full name */}
        <motion.div
          custom={1}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <Label htmlFor="name" className="text-[#111827] text-sm font-medium">
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Alex Chen"
            autoComplete="name"
            className={cn(
              'h-10 rounded-lg border-[#E5E7EB] bg-white',
              'placeholder:text-[#9CA3AF]',
              'focus-visible:border-[#365CF5] focus-visible:ring-[#365CF5]/20',
              errors.name && 'border-[#EF4444] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]/20'
            )}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-[#EF4444]">{errors.name.message}</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div
          custom={2}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <Label htmlFor="signup-email" className="text-[#111827] text-sm font-medium">
            Email address
          </Label>
          <Input
            id="signup-email"
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
          custom={3}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <Label htmlFor="signup-password" className="text-[#111827] text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <motion.div
          custom={4}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <Label htmlFor="confirmPassword" className="text-[#111827] text-sm font-medium">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className={cn(
                'h-10 rounded-lg border-[#E5E7EB] bg-white pr-10',
                'placeholder:text-[#9CA3AF]',
                'focus-visible:border-[#365CF5] focus-visible:ring-[#365CF5]/20',
                errors.confirmPassword && 'border-[#EF4444] focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]/20'
              )}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-[#EF4444]">{errors.confirmPassword.message}</p>
          )}
        </motion.div>

        {/* Terms checkbox */}
        <motion.div
          custom={5}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          className="flex items-start gap-2.5 pt-1"
        >
          <Checkbox
            id="agreeToTerms"
            checked={agreeToTerms ?? false}
            onCheckedChange={(checked) => setValue('agreeToTerms', (checked ?? false) as true)}
            className={cn(
              'mt-0.5',
              'data-[state=checked]:bg-[#365CF5] data-[state=checked]:border-[#365CF5]',
              errors.agreeToTerms && 'border-[#EF4444]'
            )}
          />
          <Label
            htmlFor="agreeToTerms"
            className="text-sm text-[#6B7280] font-normal leading-snug cursor-pointer"
          >
            I agree to the{' '}
            <span className="text-[#365CF5] hover:underline cursor-pointer">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="text-[#365CF5] hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </Label>
        </motion.div>
        {errors.agreeToTerms && (
          <p className="text-xs text-[#EF4444] -mt-2">{errors.agreeToTerms.message}</p>
        )}

        {/* Submit */}
        <motion.div
          custom={6}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </motion.div>
      </form>

      {/* Sign in link */}
      <motion.div
        custom={7}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 text-center"
      >
        <p className="text-sm text-[#6B7280]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthView('sign-in')}
            className="text-[#365CF5] hover:text-[#2a4fd4] font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
