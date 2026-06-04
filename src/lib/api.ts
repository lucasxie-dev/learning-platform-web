import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

import {
  clearStoredTokens,
  getStoredTokens,
  storeTokens,
} from '@/features/auth/token-storage'
import type { TokenResponse } from '@/features/auth/types'

export type ApiResponse<T> = {
  success: boolean
  code: string
  message: string
  data: T
  timestamp: string
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens()

  if (tokens?.accessToken) {
    config.headers.Authorization = `${tokens.tokenType} ${tokens.accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const tokens = getStoredTokens()

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !tokens?.refreshToken ||
      originalRequest.url?.includes('/api/v1/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const response = await refreshClient.post<ApiResponse<TokenResponse>>(
        '/api/v1/auth/refresh',
        { refreshToken: tokens.refreshToken },
      )
      const nextTokens = response.data.data
      storeTokens(nextTokens)
      originalRequest.headers.Authorization = `${nextTokens.tokenType} ${nextTokens.accessToken}`

      return api(originalRequest)
    } catch (refreshError) {
      clearStoredTokens()
      return Promise.reject(refreshError)
    }
  },
)

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
