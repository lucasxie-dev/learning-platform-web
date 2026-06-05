import { useState, type FormEvent } from 'react'
import {
  BarChart3Icon,
  BookOpenIcon,
  EyeOffIcon,
  Grid2X2Icon,
  LockIcon,
  MailIcon,
  UploadCloudIcon,
} from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { login } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { getApiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, setAuthenticatedTokens } = useAuth()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const tokens = await login({ account, password })
      setAuthenticatedTokens(tokens)
      toast.success('Signed in successfully')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[#f8fbff] text-slate-950">
      <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
        <HeroPanel />

        <section className="relative flex min-h-svh items-center justify-center bg-white px-6 py-10">
          <div className="w-full max-w-[560px]">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-12">
              <div className="mb-9 grid justify-items-center gap-4 text-center">
                <BrandMark size="lg" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Sign in to continue to Learning Platform
                  </p>
                </div>
              </div>

              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold" htmlFor="account">
                    Email
                  </label>
                  <div className="relative">
                    <MailIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="account"
                      className="h-12 rounded-xl border-slate-200 pl-12 text-base shadow-none"
                      autoComplete="username"
                      placeholder="Enter your email"
                      value={account}
                      onChange={(event) => setAccount(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      className="h-12 rounded-xl border-slate-200 px-12 text-base shadow-none"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                    <EyeOffIcon className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      className="size-4 rounded border-slate-300 accent-blue-600"
                      type="checkbox"
                      defaultChecked
                    />
                    Remember me
                  </label>
                  <a className="font-medium text-blue-600 hover:text-blue-700" href="#forgot-password">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="h-12 rounded-xl bg-blue-600 text-base font-semibold shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm text-slate-500">
                <div className="h-px bg-slate-200" />
                <span>or continue with</span>
                <div className="h-px bg-slate-200" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SocialButton provider="Google" />
                <SocialButton provider="GitHub" />
              </div>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/register">
                  Create account
                </Link>
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              By signing in, you agree to our{' '}
              <a className="font-medium text-blue-600" href="#terms">
                Terms of Service
              </a>{' '}
              and{' '}
              <a className="font-medium text-blue-600" href="#privacy">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function HeroPanel() {
  return (
    <section className="relative hidden min-h-svh overflow-hidden bg-[#eef4ff] lg:block">
      <img
        alt="Learning platform dashboard illustration"
        className="absolute inset-0 h-full w-full object-cover"
        src="/images/login.jpg"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/65 via-transparent to-white/70" />

      <div className="relative z-10 flex min-h-svh flex-col px-10 py-9">
        <div className="flex items-center gap-4 drop-shadow-sm">
          <BrandMark />
          <span className="text-2xl font-bold tracking-tight">Learning Platform</span>
        </div>

        <div className="mt-20 max-w-xl drop-shadow-sm">
          <h2 className="text-3xl font-black leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-violet-500 to-blue-400 bg-clip-text text-transparent">
              Learn smarter,
            </span>
            <br />
            manage better.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600">
            Manage your courses, deliver engaging lessons, and track learning progress — all in one place.
          </p>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-5 pb-6">
          <FeatureCard
            icon={<Grid2X2Icon />}
            title="Course Management"
            description="Create, organize, and manage courses with ease."
            tone="blue"
          />
          <FeatureCard
            icon={<UploadCloudIcon />}
            title="Media Uploads"
            description="Upload and manage videos, audios, and documents."
            tone="purple"
          />
          <FeatureCard
            icon={<BarChart3Icon />}
            title="Learning Progress"
            description="Track engagement and measure learner success."
            tone="green"
          />
        </div>
      </div>
    </section>
  )
}

function BrandMark({ size = 'default' }: { size?: 'default' | 'lg' }) {
  return (
    <div className={`${size === 'lg' ? 'size-20' : 'size-11'} flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]`}>
      <BookOpenIcon className={size === 'lg' ? 'size-11' : 'size-7'} />
    </div>
  )
}

function SocialButton({ provider }: { provider: 'Google' | 'GitHub' }) {
  return (
    <Button type="button" variant="outline" className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50">
      {provider === 'Google' ? (
        <span className="text-lg font-black text-blue-600">G</span>
      ) : (
        <span className="text-lg font-black">⌘</span>
      )}
      Continue with {provider}
    </Button>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode
  title: string
  description: string
  tone: 'blue' | 'purple' | 'green'
}) {
  const toneClass = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-violet-100 text-violet-600',
    green: 'bg-emerald-100 text-emerald-600',
  }[tone]

  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className={`mb-5 flex size-12 items-center justify-center rounded-2xl ${toneClass}`}>
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}
