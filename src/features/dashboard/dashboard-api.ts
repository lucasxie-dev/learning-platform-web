import { api, type ApiResponse } from '@/lib/api'
import type { Dashboard } from '@/features/dashboard/types'

export async function getDashboard() {
  const response = await api.get<ApiResponse<Dashboard>>('/api/v1/dashboard')

  return response.data.data
}
