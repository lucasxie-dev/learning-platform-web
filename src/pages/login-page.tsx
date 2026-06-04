import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { login } from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/auth-context'
import { getApiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email or username to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="account">
                Account
              </label>
              <Input
                id="account"
                autoComplete="username"
                placeholder="email or username"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account yet?{' '}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/register">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
