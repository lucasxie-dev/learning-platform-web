export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
}

export type CurrentUser = {
  id: number
  email: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  status: string
  roles: string[]
  permissions: string[]
}

export type LoginRequest = {
  account: string
  password: string
}

export type RegisterRequest = {
  email: string
  username: string
  password: string
  displayName?: string
}
