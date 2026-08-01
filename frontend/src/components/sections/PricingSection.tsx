import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants';

const freeFeatures = [
  'AI Tutor — 50 messages/day',
  'Smart Notes — Unlimited',
  'PDF Upload — 5 files/month',
  'Quiz Generator — 10 quizzes/month',
  'Flashcards — Unlimited',
  'Study Planner — Full access',
  'Analytics — Basic',
  'Community Support',
];

const proFeatures = [
  'AI Tutor — Unlimited messages',
  'Smart Notes — Unlimited',
  'PDF Upload — Unlimited',
  'Quiz Generator — Unlimited',
  'Flashcards — Unlimited + Spaced Rep',
  'Study Planner — Full + AI Plans',
  'Analytics — Advanced insights',
  'Voice AI Conversations',
  'Priority Support',
  'Early access to new features',
];

export function PricingSection() {
  return (
    <section id="pricing" className="section relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/5 blur-3xl rounded-full" />

      <div className="container-xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="feature-badge mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-4 mb-5">
            Start Free.{' '}
            <span className="gradient-text">Upgrade Anytime.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            No credit card required. Get full access to all core features for free.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            id="pricing-free"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-3xl p-8 border border-white/8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Free</h3>
                <p className="text-xs text-slate-500">Forever free, no card needed</p>
              </div>
            </div>

            <div className="mt-6 mb-8">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="text-slate-400 ml-2">/month</span>
            </div>

            <Button
              as="a"
              href={ROUTES.SIGNUP}
              variant="outline"
              fullWidth
              size="lg"
              id="pricing-free-cta"
            >
              Get Started Free
            </Button>

            <div className="mt-8 space-y-3">
              {freeFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            id="pricing-pro"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl p-8 bg-brand-gradient shadow-glow-xl overflow-hidden"
          >
            {/* Shine overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Pro</h3>
                    <p className="text-xs text-white/60">Unlimited everything</p>
                  </div>
                </div>
                <Badge variant="outline" size="sm" className="border-white/30 text-white">
                  Coming Soon
                </Badge>
              </div>

              <div className="mt-6 mb-8">
                <span className="text-5xl font-black text-white">$9</span>
                <span className="text-white/60 ml-2">/month</span>
              </div>

              <Button
                variant="secondary"
                fullWidth
                size="lg"
                disabled
                id="pricing-pro-cta"
                className="bg-white/20 border-white/20 text-white hover:bg-white/30"
              >
                Join Waitlist
              </Button>

              <div className="mt-8 space-y-3">
                {proFeatures.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/80">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Guarantee note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-sm text-slate-500 mt-8"
        >
          🔒 No credit card required · 100% free to start · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
