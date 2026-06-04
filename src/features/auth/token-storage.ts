import type { TokenResponse } from '@/features/auth/types'

const storageKey = 'learning-platform.tokens'

export function getStoredTokens() {
  const rawTokens = localStorage.getItem(storageKey)

  if (!rawTokens) {
    return null
  }

  try {
    return JSON.parse(rawTokens) as TokenResponse
  } catch {
    clearStoredTokens()
    return null
  }
}

export function storeTokens(tokens: TokenResponse) {
  localStorage.setItem(storageKey, JSON.stringify(tokens))
}

export function clearStoredTokens() {
  localStorage.removeItem(storageKey)
}
