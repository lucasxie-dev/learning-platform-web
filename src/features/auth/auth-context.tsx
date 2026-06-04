import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  clearStoredTokens,
  getStoredTokens,
  storeTokens,
} from '@/features/auth/token-storage'
import type { TokenResponse } from '@/features/auth/types'

type AuthContextValue = {
  isAuthenticated: boolean
  tokens: TokenResponse | null
  setAuthenticatedTokens: (tokens: TokenResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<TokenResponse | null>(null)

  useEffect(() => {
    setTokens(getStoredTokens())
  }, [])

  const setAuthenticatedTokens = useCallback((nextTokens: TokenResponse) => {
    storeTokens(nextTokens)
    setTokens(nextTokens)
  }, [])

  const logout = useCallback(() => {
    clearStoredTokens()
    setTokens(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(tokens?.accessToken),
      tokens,
      setAuthenticatedTokens,
      logout,
    }),
    [logout, setAuthenticatedTokens, tokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
