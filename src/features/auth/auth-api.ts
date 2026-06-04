import { api, type ApiResponse } from '@/lib/api'
import type {
  CurrentUser,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from '@/features/auth/types'

export async function login(request: LoginRequest) {
  const response = await api.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/login',
    request,
  )

  return response.data.data
}

export async function register(request: RegisterRequest) {
  const response = await api.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/register',
    request,
  )

  return response.data.data
}

export async function getCurrentUser() {
  const response = await api.get<ApiResponse<CurrentUser>>('/api/v1/users/me')

  return response.data.data
}
