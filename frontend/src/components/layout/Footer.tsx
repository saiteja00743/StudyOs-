import { Brain, Globe, Code2, MessageSquare, Users } from 'lucide-react';
import { APP_NAME, NAV_LINKS, SOCIAL_LINKS, ROUTES } from '@/constants';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Roadmap', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Community', href: '#' },
    { label: 'Changelog', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { label: 'Twitter / X', icon: Globe, href: SOCIAL_LINKS.TWITTER },
  { label: 'GitHub', icon: Code2, href: SOCIAL_LINKS.GITHUB },
  { label: 'Discord', icon: MessageSquare, href: SOCIAL_LINKS.DISCORD },
  { label: 'LinkedIn', icon: Users, href: SOCIAL_LINKS.LINKEDIN },
];

export function Footer() {
  return (
    <footer id="footer" className="border-t border-white/5 bg-surface-950/80">
      <div className="container-xl px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <a href={ROUTES.HOME} className="flex items-center gap-2.5 mb-4" id="footer-logo">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Study<span className="gradient-text">OS</span>
              </span>
            </a>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs">
              Your AI-powered study operating system. Built for students who want to learn smarter, not harder.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-500/20 hover:border-brand-500/30 transition-all duration-200"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved. Built with ❤️ for students worldwide.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-1.5 h-1.5 bg-success rounded-full inline-block" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
