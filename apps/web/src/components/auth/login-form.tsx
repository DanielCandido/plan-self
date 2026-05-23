'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Mínimo de 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  defaultEmail?: string;
}

export function LoginForm({ defaultEmail = '' }: LoginFormProps) {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const defaultRemember = storage.getRememberMe();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: defaultEmail || storage.getRememberEmail(),
      password: '',
      rememberMe: defaultRemember,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });
    } catch {
      // error handled in store
    }
  };

  const isDisabled = isLoading || (!isValid && isDirty);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium text-[#d2bbff]/70 tracking-wide"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nome@exemplo.com"
          {...register('email')}
          className="auth-input w-full rounded-lg px-3.5 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        <AnimatePresence>
          {errors.email && (
            <motion.p
              id="email-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-[11px] text-red-400/90"
              role="alert"
            >
              {errors.email.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-xs font-medium text-[#d2bbff]/70 tracking-wide"
          >
            Senha
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#d2bbff]/50 transition-colors hover:text-[#d2bbff]/80"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className="auth-input w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white/90 placeholder-white/25 outline-none"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            tabIndex={0}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <AnimatePresence>
          {errors.password && (
            <motion.p
              id="password-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-[11px] text-red-400/90"
              role="alert"
            >
              {errors.password.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Remember me */}
      <label className="flex cursor-pointer items-center gap-2.5 select-none">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="peer sr-only"
            id="remember-me"
          />
          <div className="h-4 w-4 rounded border border-white/15 bg-white/5 transition-colors peer-checked:border-[#7c3aed] peer-checked:bg-[#7c3aed]/20 peer-focus-visible:ring-2 peer-focus-visible:ring-[#7c3aed]/50" />
          <svg
            className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-[#7c3aed] opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xs text-[#d2bbff]/55">Lembrar de mim</span>
      </label>

      {/* Global error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400"
            role="alert"
          >
            {error.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.99 }}
        className="btn-primary-auth relative mt-1 flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={isLoading}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Spinner />
              Entrando…
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Entrar
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Sign-up link */}
      <p className="mt-1 text-center text-xs text-[#d2bbff]/45">
        Não tem uma conta?{' '}
        <Link
          href="/register"
          className="font-medium text-[#d2bbff]/75 underline-offset-2 hover:text-[#d2bbff] transition-colors hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
