'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'

const loginSchema = z.object({
  username: z.string().min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormData) => {
    setServerError(null)
    try {
      const res = await axios.post('/api/auth/login', values, {
        withCredentials: true,
      })

      if (res.data.success && res.data.data) {
        const { accessToken, user } = res.data.data
        setAccessToken(accessToken)
        setUser(user)
        router.push('/')
      } else {
        setServerError(res.data.error || 'Erreur lors de la connexion')
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string } }; data?: { error?: string } }
      if (error.response?.status === 401) {
        setServerError(error.response.data?.error || 'Nom d\'utilisateur ou mot de passe incorrect')
      } else if (error.response?.data?.error) {
        setServerError(error.response.data.error)
      } else {
        setServerError('Erreur de connexion au serveur. Veuillez réessayer.')
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-alu-bg px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-alu-border bg-alu-surface shadow-2xl overflow-hidden">
          {/* Brushed metal header */}
          <div className="brushed-metal px-8 py-10 text-center">
            {/* Logo icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-alu-accent/10 border border-alu-accent/20">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-alu-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            {/* Title */}
            <h1 className="text-2xl font-bold text-alu-text tracking-tight">
              AluAtelier
              <span className="ml-1.5 text-alu-accent">Pro</span>
            </h1>
            <p className="mt-2 text-sm text-alu-sub">
              Gestion d&apos;atelier aluminium
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-5">
            {/* Server error */}
            {serverError && (
              <div
                className="rounded-lg border border-alu-danger/30 bg-alu-danger/10 px-4 py-3 text-sm text-alu-danger"
                role="alert"
              >
                {serverError}
              </div>
            )}

            {/* Username */}
            <Input
              label="Nom d'utilisateur"
              placeholder="Entrez votre nom d'utilisateur"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-alu-sub"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                  className={
                    'flex h-10 w-full rounded-lg border border-alu-border bg-alu-bg px-3 py-2 pr-10 text-sm ' +
                    'text-alu-text placeholder:text-alu-muted ' +
                    'transition-colors duration-150 ' +
                    'focus:outline-none focus:ring-2 focus:ring-alu-accent/50 focus:border-alu-accent ' +
                    (errors.password ? 'border-alu-danger focus:ring-alu-danger/50 focus:border-alu-danger' : '')
                  }
                  aria-invalid={errors.password ? 'true' : undefined}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-alu-muted hover:text-alu-sub transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-alu-danger" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              <LogIn className="h-5 w-5" />
              Se connecter
            </Button>
          </form>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-alu-muted">
          AluAtelier Pro &mdash; Atelier Aluminium
        </p>
      </div>
    </main>
  )
}