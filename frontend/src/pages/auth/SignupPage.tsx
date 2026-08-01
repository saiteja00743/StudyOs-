import React, { useState } from 'react';
import { useForm, UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

// ─── Validation Schema ─────────────────────────────────────
const schema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

// ─── Password Strength ─────────────────────────────────────
function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-danger' };
  if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-warning' };
  if (score <= 3) return { level: 3, label: 'Good', color: 'bg-info' };
  return { level: 4, label: 'Strong', color: 'bg-success' };
}

// ─── Input Field ───────────────────────────────────────────
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  icon: React.ElementType;
  error?: string;
  rightElement?: React.ReactNode;
  registration: UseFormRegisterReturn;
}

function InputField({ id, label, type = 'text', placeholder, icon: Icon, error, rightElement, registration }: InputFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          {...registration}
          className={cn(
            'w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200',
            error ? 'border-danger/60 focus:ring-danger' : 'border-white/10 hover:border-white/20'
          )}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-danger"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Signup Page ───────────────────────────────────────────
export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (error) {
      setServerError(error.message);
    } else {
      setSuccess(true);
      // If email confirmation is disabled, redirect immediately
      setTimeout(() => navigate(ROUTES.DASHBOARD), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 group" id="signup-logo">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Study<span className="gradient-text">OS</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Start studying smarter. Free forever.
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 border border-white/8">
          {success ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Account Created!</h3>
              <p className="text-slate-400 text-sm">
                Check your email to confirm your account, then you'll be redirected to your dashboard.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="signup-form">
              {/* Full Name */}
              <InputField
                id="signup-name"
                label="Full Name"
                placeholder="Alex Johnson"
                icon={User}
                error={errors.fullName?.message}
                registration={register('fullName')}
              />

              {/* Email */}
              <InputField
                id="signup-email"
                label="Email address"
                type="email"
                placeholder="alex@university.edu"
                icon={Mail}
                error={errors.email?.message}
                registration={register('email')}
              />

              {/* Password */}
              <div>
                <InputField
                  id="signup-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  icon={Lock}
                  error={errors.password?.message}
                  registration={register('password')}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {/* Strength meter */}
                {passwordValue && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            i <= strength.level ? strength.color : 'bg-white/10'
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn(
                      'text-xs font-medium',
                      strength.level <= 1 ? 'text-danger' :
                      strength.level === 2 ? 'text-warning' :
                      strength.level === 3 ? 'text-info' : 'text-success'
                    )}>
                      {strength.label} password
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <InputField
                id="signup-confirm"
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                icon={Lock}
                error={errors.confirmPassword?.message}
                registration={register('confirmPassword')}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Server Error */}
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger"
                  id="signup-error"
                >
                  {serverError}
                </motion.div>
              )}

              {/* Terms */}
              <p className="text-xs text-slate-500 text-center">
                By signing up, you agree to our{' '}
                <a href="#" className="text-brand-400 hover:underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-brand-400 hover:underline">Privacy Policy</a>
              </p>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                id="signup-submit"
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
                  'bg-brand-gradient text-white font-semibold text-sm',
                  'shadow-glow hover:shadow-glow-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950',
                  isSubmitting && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </form>
          )}

          {/* Login link */}
          {!success && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-brand-400 font-medium hover:text-brand-300 transition-colors"
                id="signup-login-link"
              >
                Log in
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
