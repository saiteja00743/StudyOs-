import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Brain, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    const { error } = await updatePassword(data.password);
    if (error) {
      setServerError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.DASHBOARD), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Study<span className="gradient-text">OS</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Set new password</h1>
          <p className="mt-2 text-sm text-slate-400">Choose a strong new password</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-white/8">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Password updated!</h3>
              <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="reset-form">
              {/* New Password */}
              {(['password', 'confirmPassword'] as const).map((field) => (
                <div key={field}>
                  <label htmlFor={`reset-${field}`} className="block text-sm font-medium text-slate-300 mb-1.5">
                    {field === 'password' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      id={`reset-${field}`}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={field === 'password' ? 'Min 8 chars...' : 'Repeat password'}
                      {...register(field)}
                      className={cn(
                        'w-full bg-white/5 border rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-600',
                        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
                        errors[field] ? 'border-danger/60' : 'border-white/10 hover:border-white/20'
                      )}
                    />
                    {field === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {errors[field] && (
                    <p className="mt-1.5 text-xs text-danger">{errors[field]?.message}</p>
                  )}
                </div>
              ))}

              {serverError && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                  {serverError}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                id="reset-submit"
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                  'bg-brand-gradient text-white font-semibold text-sm shadow-glow hover:shadow-glow-lg transition-all',
                  isSubmitting && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
