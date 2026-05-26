'use client';

import { motion } from 'framer-motion';
import { AuthBackground } from '@/components/auth/auth-background';
import { AuthCard } from '@/components/auth/auth-card';
import { SocialLogin } from '@/components/auth/social-login';
import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/hooks/useAuth';
import { PlanSelfLogo } from '@plan-self/ui';

const dividerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { delay: 0.3, duration: 0.4 } },
};

export default function LoginPage() {
  const { loginWithOAuth, isLoading } = useAuth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <AuthBackground />

      <AuthCard>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-5 flex justify-center"
          aria-label="Plan Self"
        >
          <PlanSelfLogo />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mb-6 text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-[#d2bbff]/55">
            Entre com sua conta Plan Self
          </p>
        </motion.div>

        {/* Social login */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <SocialLogin onLogin={loginWithOAuth} isLoading={isLoading} />
        </motion.div>

        {/* Divider */}
        <motion.div
          variants={dividerVariants}
          initial="hidden"
          animate="visible"
          className="my-5 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d2bbff]/35">
            OU USE E-MAIL
          </span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </motion.div>

        {/* Email form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
        >
          <LoginForm />
        </motion.div>
      </AuthCard>

      {/* Footer links */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-7 flex items-center gap-4"
      >
        {['Privacidade', 'Termos', 'Suporte'].map((link) => (
          <a
            key={link}
            href="#"
            className="text-xs font-medium uppercase tracking-[0.1em] text-[#d2bbff]/30 transition-colors hover:text-[#d2bbff]/60"
          >
            {link}
          </a>
        ))}
      </motion.footer>
    </main>
  );
}
