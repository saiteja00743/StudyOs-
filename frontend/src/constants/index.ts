export const APP_NAME = 'StudyOS AI';
export const APP_TAGLINE = 'Your AI-Powered Study Operating System';
export const APP_DESCRIPTION =
  'StudyOS AI combines AI tutoring, smart notes, PDF intelligence, quiz generation, flashcards, and study planning into one powerful platform for students.';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  NOTES: '/notes',
  PDF: '/pdf',
  QUIZ: '/quiz',
  FLASHCARDS: '/flashcards',
  PLANNER: '/planner',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  INTERVIEW: '/interview',
  ROADMAP: '/roadmap',
} as const;

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
] as const;

export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/studyosai',
  GITHUB: 'https://github.com/studyos-ai',
  DISCORD: 'https://discord.gg/studyosai',
  LINKEDIN: 'https://linkedin.com/company/studyosai',
} as const;
