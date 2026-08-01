import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { NAV_LINKS, APP_NAME, ROUTES } from '@/constants';
import { cn } from '@/utils/cn';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'glass-strong border-b border-white/5 shadow-glass'
            : 'bg-transparent'
        )}
      >
        <div className="container-xl">
          <nav className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group" id="nav-logo">
              <div className="relative w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                <Brain className="w-5 h-5 text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface-950 animate-pulse" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Study<span className="gradient-text">OS</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                as="a"
                href={ROUTES.LOGIN}
                variant="ghost"
                size="sm"
                id="nav-login-btn"
              >
                Log in
              </Button>
              <Button
                as="a"
                href={ROUTES.SIGNUP}
                variant="primary"
                size="sm"
                leftIcon={<Zap className="w-3.5 h-3.5" />}
                id="nav-signup-btn"
              >
                Get Started Free
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 glass-strong border-b border-white/5 px-4 py-6 md:hidden"
            id="nav-mobile-drawer"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-2">
                <Button
                  as="a"
                  href={ROUTES.LOGIN}
                  variant="secondary"
                  fullWidth
                  id="mobile-login-btn"
                >
                  Log in
                </Button>
                <Button
                  as="a"
                  href={ROUTES.SIGNUP}
                  variant="primary"
                  fullWidth
                  leftIcon={<Zap className="w-4 h-4" />}
                  id="mobile-signup-btn"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
