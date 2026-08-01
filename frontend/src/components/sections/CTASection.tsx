import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';

export function CTASection() {
  return (
    <section id="cta" className="section relative overflow-hidden">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-brand-gradient opacity-90" />
          <div className="absolute inset-0 bg-mesh-gradient" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute inset-0 dot-pattern opacity-20" />

          {/* Content */}
          <div className="relative z-10 text-center px-8 py-20">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white/80 text-xs font-semibold mb-6"
            >
              🚀 Free forever • No credit card
            </motion.span>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white mb-6 leading-tight">
              Start Your Smarter Study<br />Journey Today
            </h2>

            <p className="text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
              Join 2,000+ students already using StudyOS AI to study smarter, learn faster, and achieve more — completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as="a"
                href={ROUTES.SIGNUP}
                size="xl"
                className="bg-white text-brand-600 hover:bg-white/90 shadow-card font-bold"
                leftIcon={<Zap className="w-5 h-5" />}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                id="cta-final-signup"
              >
                Get Started Free
              </Button>
              <Button
                as="a"
                href="#features"
                size="xl"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                variant="outline"
                id="cta-final-features"
              >
                Explore Features
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
