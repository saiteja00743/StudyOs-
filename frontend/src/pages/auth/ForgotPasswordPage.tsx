import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Brain, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const { error } = await resetPassword(data.email);
    if (error) {
      setServerError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5 group" id="forgot-logo">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Study<span className="gradient-text">OS</span>
            </span>
          </Link>
          {!sent && (
            <>
              <h1 className="mt-6 text-2xl font-bold text-white">Reset your password</h1>
              <p className="mt-2 text-sm text-slate-400">
                Enter your email and we'll send you a reset link
              </p>
            </>
          )}
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-white/8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
              id="forgot-success"
            >
              <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                We've sent a password reset link to your email address. Check your inbox (and spam folder).
              </p>
              <Link
                to={ROUTES.LOGIN}
                className="mt-6 inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                id="forgot-back-login"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="forgot-form">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="alex@university.edu"
                    {...register('email')}
                    className={cn(
                      'w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600',
                      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200',
                      errors.email ? 'border-danger/60' : 'border-white/10 hover:border-white/20'
                    )}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>}
              </div>

              {serverError && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                  {serverError}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                id="forgot-submit"
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
                  'bg-brand-gradient text-white font-semibold text-sm shadow-glow hover:shadow-glow-lg transition-all',
                  isSubmitting && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </motion.button>

              <Link
                to={ROUTES.LOGIN}
                className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                id="forgot-back-btn"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
